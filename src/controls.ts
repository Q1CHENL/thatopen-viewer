import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { LodMode } from "@thatopen/fragments";
import type { ViewerRuntime } from "./types";
import type { ViewerUi } from "./ui";

type ControlsOptions = {
  runtime: ViewerRuntime;
  ui: ViewerUi;
  isSelectionOutlineActive: () => boolean;
};

export const createControls = ({
  runtime,
  ui,
  isSelectionOutlineActive,
}: ControlsOptions) => {
  const updateRendererMode = () => {
    runtime.renderer.mode = Number(ui.rendererMode.value) as OBC.RendererMode;
    runtime.renderer.turnOffOnManualMode =
      runtime.renderer.mode === OBC.RendererMode.MANUAL;
    runtime.requestRendererUpdate();
  };

  ui.rendererMode.addEventListener("change", updateRendererMode);
  updateRendererMode();

  const updatePostproduction = () => {
    const edgesEnabled = ui.edgesToggle.checked;
    runtime.renderer.postproduction.enabled = edgesEnabled || isSelectionOutlineActive();
    runtime.renderer.postproduction.style = edgesEnabled
      ? OBF.PostproductionAspect.COLOR_PEN
      : OBF.PostproductionAspect.COLOR;

    if (edgesEnabled) {
      runtime.renderer.postproduction.edgesPass.mode = Number(
        ui.edgeMode.value,
      ) as OBF.EdgeDetectionPassMode;
    }

    runtime.requestRendererUpdate();
  };

  ui.edgesToggle.addEventListener("change", updatePostproduction);
  ui.edgeMode.addEventListener("change", updatePostproduction);
  updatePostproduction();

  const selectedLodMode = () => Number(ui.lodMode.value) as LodMode;

  const applyLodModeToModels = async () => {
    const mode = selectedLodMode();
    const updates = [...runtime.fragments.list.values()].map((model) => model.setLodMode(mode));
    await Promise.all(updates);
    await runtime.fragments.core.update(true);
    runtime.requestRendererUpdate();
  };

  ui.lodMode.addEventListener("change", () => {
    void applyLodModeToModels();
  });

  return {
    selectedLodMode,
    updatePostproduction,
  };
};

