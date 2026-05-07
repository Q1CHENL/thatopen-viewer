import { LodMode } from "@thatopen/fragments";
import type { DownloadableFrag, ViewerRuntime } from "./types";
import type { ViewerUi } from "./ui";
import { cloneArrayBuffer, downloadFile, fragFileNameFromIfc, modelIdFromFile } from "./utils";
import { fitAllModels } from "./runtime";

type ModelLoadingControllerOptions = {
  runtime: ViewerRuntime;
  ui: ViewerUi;
  clearSelection: () => void;
  getSelectedItem: () => { modelId: string; localId: number } | null;
  selectedLodMode: () => LodMode;
};

export const createModelLoadingController = ({
  runtime,
  ui,
  clearSelection,
  getSelectedItem,
  selectedLodMode,
}: ModelLoadingControllerOptions) => {
  const { fragments, ifcLoader, world, requestRendererUpdate } = runtime;
  const downloadableFrags = new Map<string, DownloadableFrag>();

  const refreshModelsList = () => {
    ui.modelsList.replaceChildren();

    if (fragments.list.size === 0) {
      ui.modelsList.classList.add("empty");
      ui.modelsList.textContent = "No models loaded.";
      return;
    }

    ui.modelsList.classList.remove("empty");

    for (const [modelId] of fragments.list) {
      const downloadableFrag = downloadableFrags.get(modelId);
      const row = document.createElement("div");
      row.className = "model-row";

      const label = document.createElement("span");
      label.className = "model-name";
      label.title = modelId;
      label.textContent = modelId;

      const downloadButton = document.createElement("button");
      downloadButton.className = "download-model-button";
      downloadButton.type = "button";
      downloadButton.textContent = "Download";
      downloadButton.disabled = ui.fileInput.disabled || !downloadableFrag;
      downloadButton.addEventListener("click", () => {
        const currentDownload = downloadableFrags.get(modelId);
        if (!currentDownload) {
          refreshModelsList();
          return;
        }

        downloadFile(currentDownload.fileName, currentDownload.buffer);
      });

      const removeButton = document.createElement("button");
      removeButton.className = "remove-model-button";
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.disabled = ui.fileInput.disabled;
      removeButton.addEventListener("click", async () => {
        if (getSelectedItem()?.modelId === modelId) {
          clearSelection();
        }
        downloadableFrags.delete(modelId);
        fragments.core.disposeModel(modelId);
        await fragments.core.update(true);
        requestRendererUpdate();
        refreshModelsList();
      });

      row.append(label, downloadButton, removeButton);
      ui.modelsList.append(row);
    }
  };

  const clearModels = () => {
    for (const [modelId] of fragments.list) {
      fragments.core.disposeModel(modelId);
    }
    clearSelection();
    downloadableFrags.clear();
    requestRendererUpdate();
    refreshModelsList();
  };

  fragments.list.onItemSet.add(refreshModelsList);
  fragments.list.onItemDeleted.add((modelId) => {
    downloadableFrags.delete(modelId);
    refreshModelsList();
  });

  const loadFragBuffer = async (
    buffer: ArrayBuffer | Uint8Array,
    modelId: string,
    label: string,
  ) => {
    ui.setStatus(`Loading ${label} as Fragments...`);
    await fragments.core.load(buffer, { modelId, camera: world.camera.three });
  };

  const loadFragFile = async (file: File, modelId: string, index: number, total: number) => {
    const label = total > 1 ? `${file.name} (${index}/${total})` : file.name;
    ui.setStatus(`Reading ${label}...`);
    const downloadBuffer = await file.arrayBuffer();
    const loadBuffer = cloneArrayBuffer(downloadBuffer);
    downloadableFrags.set(modelId, {
      fileName: file.name,
      buffer: downloadBuffer,
    });
    refreshModelsList();
    await loadFragBuffer(loadBuffer, modelId, label);
    downloadableFrags.set(modelId, {
      fileName: file.name,
      buffer: downloadBuffer,
    });
    refreshModelsList();
  };

  const loadIfcFile = async (
    file: File,
    modelId: string,
    index: number,
    total: number,
  ) => {
    const label = total > 1 ? `${file.name} (${index}/${total})` : file.name;

    ui.setStatus(`Reading ${label}...`);
    const buffer = new Uint8Array(await file.arrayBuffer());

    ui.setStatus(`Converting ${label} to Fragments...`);
    const model = await ifcLoader.load(buffer, true, modelId, {
      processData: {
        progressCallback: (progress, data) => {
          const percent = Math.round(progress * 100);
          ui.setStatus(`${label}: ${data.process} ${data.state} ${percent}%`);
        },
      },
    });

    const fragFileName = fragFileNameFromIfc(file.name);
    ui.setStatus(`Preparing ${fragFileName} for download...`);
    const fragBuffer = await model.getBuffer(false);
    downloadableFrags.set(modelId, {
      fileName: fragFileName,
      buffer: cloneArrayBuffer(fragBuffer),
    });
    refreshModelsList();
  };

  const loadFiles = async (
    files: File[],
    kind: "IFC" | "FRAG",
    loadOne: (file: File, modelId: string, index: number, total: number) => Promise<void>,
  ) => {
    if (files.length === 0) return;

    ui.setBusy(true);
    refreshModelsList();
    const existingIds = new Set(fragments.list.keys());
    const filesToLoad = files.map((file) => ({
      file,
      modelId: modelIdFromFile(file, existingIds),
    }));

    try {
      for (const [index, item] of filesToLoad.entries()) {
        await loadOne(item.file, item.modelId, index + 1, filesToLoad.length);
      }

      await fragments.core.update(true);
      requestRendererUpdate();
      await fitAllModels(runtime);
    } catch (error) {
      console.error(error);
      ui.setStatus(error instanceof Error ? error.message : `Failed to load ${kind} files.`);
    } finally {
      ui.setBusy(false);
      refreshModelsList();
    }
  };

  ui.fileInput.addEventListener("change", () => {
    const files = ui.fileInput.files ? Array.from(ui.fileInput.files) : [];
    void loadFiles(files, "IFC", loadIfcFile).finally(() => {
      ui.fileInput.value = "";
    });
  });

  ui.fragInput.addEventListener("change", () => {
    const files = ui.fragInput.files ? Array.from(ui.fragInput.files) : [];
    void loadFiles(files, "FRAG", loadFragFile).finally(() => {
      ui.fragInput.value = "";
    });
  });

  fragments.list.onItemSet.add(async ({ value: model }) => {
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    await model.setLodMode(selectedLodMode());
    await fragments.core.update(true);
    requestRendererUpdate();
  });

  return {
    refreshModelsList,
    clearModels,
  };
};
