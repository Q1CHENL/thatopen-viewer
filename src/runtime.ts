import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as THREE from "three";
import type { ViewerRuntime, ViewerWorld } from "./types";

const loadFragmentsWorker = async () => {
  const workerResponse = await fetch(
    "https://thatopen.github.io/engine_fragment/resources/worker.mjs",
  );

  if (!workerResponse.ok) {
    throw new Error(`Failed to fetch Fragments worker: ${workerResponse.status}`);
  }

  const workerBlob = await workerResponse.blob();
  const workerFile = new File([workerBlob], "worker.mjs", {
    type: "text/javascript",
  });

  return URL.createObjectURL(workerFile);
};

export const createRuntime = async (container: HTMLElement): Promise<ViewerRuntime> => {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBF.PostproductionRenderer
  >() as ViewerWorld;

  world.scene = new OBC.SimpleScene(components);
  world.scene.setup();
  world.scene.three.background = null;

  const renderer = new OBF.PostproductionRenderer(components, container);
  const canvas = renderer.three.domElement;
  world.renderer = renderer;
  world.camera = new OBC.OrthoPerspectiveCamera(components);
  await world.camera.controls.setLookAt(80, 45, 80, 0, 0, 0);

  components.init();

  const fragments = components.get(OBC.FragmentsManager);
  const ifcLoader = components.get(OBC.IfcLoader);
  const workerUrl = await loadFragmentsWorker();
  fragments.init(workerUrl);
  const fastModelPicker = components.get(OBC.FastModelPickers).get(world);
  fragments.core.settings.maxUpdateRate = 0;

  await ifcLoader.setup({
    autoSetWasm: false,
    wasm: {
      path: "https://unpkg.com/web-ifc@0.0.74/",
      absolute: true,
    },
  });

  const requestRendererUpdate = () => {
    if (renderer.mode === OBC.RendererMode.MANUAL) {
      renderer.needsUpdate = true;
    }
  };

  world.camera.controls.addEventListener("update", () => {
    fragments.core.update();
  });
  world.camera.controls.addEventListener("update", requestRendererUpdate);
  renderer.onResize.add(requestRendererUpdate);

  fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
    const maybeLodMaterial = material as { isLodMaterial?: boolean };
    if (maybeLodMaterial.isLodMaterial) return;

    material.polygonOffset = true;
    material.polygonOffsetUnits = 1;
    material.polygonOffsetFactor = 1;
  });

  return {
    components,
    world,
    renderer,
    canvas,
    fragments,
    ifcLoader,
    fastModelPicker,
    workerUrl,
    requestRendererUpdate,
  };
};

export const fitAllModels = async (runtime: ViewerRuntime) => {
  const { fragments, world, requestRendererUpdate } = runtime;

  await fragments.core.update(true);

  const box = new THREE.Box3().makeEmpty();
  for (const model of fragments.list.values()) {
    const modelBoxes = await model.getBoxes();
    for (const modelBox of modelBoxes) {
      box.union(modelBox);
    }
  }

  if (box.isEmpty()) {
    await world.camera.fitToItems();
    requestRendererUpdate();
    return;
  }

  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  sphere.radius *= 1.35;
  await world.camera.controls.fitToSphere(sphere, true);
  world.camera.controls.setOrbitPoint(sphere.center.x, sphere.center.y, sphere.center.z);
  requestRendererUpdate();
};
