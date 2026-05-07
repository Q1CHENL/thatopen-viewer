import type * as OBC from "@thatopen/components";
import type * as OBF from "@thatopen/components-front";
import type * as THREE from "three";

export type ViewerWorld = OBC.World & {
  scene: OBC.SimpleScene;
  camera: OBC.OrthoPerspectiveCamera;
  renderer: OBF.PostproductionRenderer;
};

export type ViewerRuntime = {
  components: OBC.Components;
  world: ViewerWorld;
  renderer: OBF.PostproductionRenderer;
  canvas: HTMLCanvasElement;
  fragments: OBC.FragmentsManager;
  ifcLoader: OBC.IfcLoader;
  fastModelPicker: OBC.FastModelPicker;
  workerUrl: string;
  requestRendererUpdate: () => void;
};

export type DownloadableFrag = {
  fileName: string;
  buffer: ArrayBuffer;
};

export type SelectedObject = {
  modelId: string;
  localId: number;
};

export type CanvasPointer = {
  raw: THREE.Vector2;
  normalized: THREE.Vector2;
};
