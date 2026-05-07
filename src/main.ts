import "./style.css";
import { createControls } from "./controls";
import { createModelLoadingController } from "./modelLoading";
import { createRuntime, fitAllModels } from "./runtime";
import { createSelectionController } from "./selection";
import { createUi } from "./ui";

const start = async () => {
  const ui = createUi();
  const runtime = await createRuntime(ui.container);

  let hasSelectionOutline = false;
  const controls = createControls({
    runtime,
    ui,
    isSelectionOutlineActive: () => hasSelectionOutline,
  });

  const selection = createSelectionController({
    runtime,
    ui,
    setSelectionOutlineActive: (active) => {
      hasSelectionOutline = active;
      controls.updatePostproduction();
    },
  });

  const models = createModelLoadingController({
    runtime,
    ui,
    clearSelection: selection.clearSelection,
    getSelectedItem: selection.getSelectedItem,
    selectedLodMode: controls.selectedLodMode,
  });

  let frameCount = 0;
  let fpsWindowStarted = performance.now();
  runtime.world.renderer.onAfterUpdate.add(() => {
    frameCount += 1;
    const now = performance.now();
    const elapsed = now - fpsWindowStarted;

    if (elapsed < 500) return;

    const fps = Math.round((frameCount * 1000) / elapsed);
    ui.fpsValue.textContent = String(fps);
    frameCount = 0;
    fpsWindowStarted = now;
  });

  ui.clearButton.addEventListener("click", () => {
    models.clearModels();
  });

  ui.fitButton.addEventListener("click", () => {
    runtime.requestRendererUpdate();
    void fitAllModels(runtime);
  });

  window.addEventListener("beforeunload", () => {
    URL.revokeObjectURL(runtime.workerUrl);
    runtime.components.dispose();
  });

  models.refreshModelsList();
  ui.renderSelectedObject(null);
};

start().catch((error: unknown) => {
  console.error(error);
  const ui = createUi();
  ui.setBusy(false);
});
