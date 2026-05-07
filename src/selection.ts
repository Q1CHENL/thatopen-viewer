import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { type RaycastResult } from "@thatopen/fragments";
import * as THREE from "three";
import type { CanvasPointer, SelectedObject, ViewerRuntime } from "./types";
import type { ViewerUi } from "./ui";
import { runAfterNextPaint } from "./utils";

type SelectionControllerOptions = {
  runtime: ViewerRuntime;
  ui: ViewerUi;
  setSelectionOutlineActive: (active: boolean) => void;
};

export type SelectionController = {
  clearSelection: () => void;
  getSelectedItem: () => SelectedObject | null;
};

export const createSelectionController = ({
  runtime,
  ui,
  setSelectionOutlineActive,
}: SelectionControllerOptions): SelectionController => {
  const { canvas, fastModelPicker, fragments, outliner, world, requestRendererUpdate } =
    createSelectionRuntime(runtime);
  let selectedItem: SelectedObject | null = null;
  let selectionVersion = 0;
  let pointerDown: { x: number; y: number } | null = null;
  let outlineTask = Promise.resolve();

  const clearSelection = () => {
    selectedItem = null;
    selectionVersion += 1;
    ui.renderSelectedObject(null);
    outliner.clean();
    setSelectionOutlineActive(false);
  };

  const getCanvasPointer = (event: MouseEvent): CanvasPointer => {
    const bounds = canvas.getBoundingClientRect();
    return {
      raw: new THREE.Vector2(event.clientX, event.clientY),
      normalized: new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
    };
  };

  const raycastFastModel = async (pointer: CanvasPointer) => {
    const modelId = await fastModelPicker.getModelAt(pointer.normalized);
    if (!modelId) return null;

    const model = fragments.list.get(modelId);
    if (!model) return null;

    return model.raycast({
      camera: world.camera.three,
      mouse: pointer.raw,
      dom: canvas,
    });
  };

  const queueSelectionOutline = (hit: RaycastResult, version: number) => {
    outlineTask = outlineTask
      .catch(() => undefined)
      .then(async () => {
        if (selectionVersion !== version) return;

        outliner.clean();
        setSelectionOutlineActive(true);

        await outliner.addItems({
          [hit.fragments.modelId]: new Set([hit.localId]),
        });

        if (selectionVersion !== version) return;
        requestRendererUpdate();
      });
  };

  const selectHit = async (pointer: CanvasPointer, version: number) => {
    const hit = await raycastFastModel(pointer);
    if (selectionVersion !== version) return;

    if (!hit) {
      clearSelection();
      return;
    }

    selectedItem = {
      modelId: hit.fragments.modelId,
      localId: hit.localId,
    };
    ui.renderSelectedObject(selectedItem);

    runAfterNextPaint(() => {
      if (selectionVersion !== version || !selectedItem) return;
      queueSelectionOutline(hit, version);
    });
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointerDown = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener("click", (event) => {
    if (event.button !== 0) return;

    if (pointerDown) {
      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      pointerDown = null;
      if (Math.hypot(dx, dy) > 5) return;
    }

    selectionVersion += 1;
    const currentVersion = selectionVersion;
    const pointer = getCanvasPointer(event);
    runAfterNextPaint(() => {
      if (selectionVersion !== currentVersion) return;
      void selectHit(pointer, currentVersion);
    });
  });

  return {
    clearSelection,
    getSelectedItem: () => selectedItem,
  };
};

const createSelectionRuntime = (runtime: ViewerRuntime) => {
  const outliner = runtime.components.get(OBF.Outliner);
  runtime.renderer.postproduction.enabled = true;
  runtime.renderer.postproduction.style = OBF.PostproductionAspect.COLOR;

  outliner.world = runtime.world;
  outliner.color = new THREE.Color("#00a7ff");
  outliner.fillColor = new THREE.Color("#00a7ff");
  outliner.fillOpacity = 0.75;
  outliner.thickness = 1;
  outliner.enabled = true;

  return {
    canvas: runtime.canvas,
    fastModelPicker: runtime.fastModelPicker,
    fragments: runtime.fragments,
    outliner,
    world: runtime.world,
    requestRendererUpdate: runtime.requestRendererUpdate,
  };
};

export const syncRendererMode = (
  runtime: ViewerRuntime,
  rendererMode: HTMLSelectElement,
) => {
  runtime.renderer.mode = Number(rendererMode.value) as OBC.RendererMode;
  runtime.renderer.turnOffOnManualMode =
    runtime.renderer.mode === OBC.RendererMode.MANUAL;
  runtime.requestRendererUpdate();
};
