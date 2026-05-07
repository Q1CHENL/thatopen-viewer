# ThatOpen IFC Viewer Benchmark

Purpose: local benchmark harness for ThatOpen's own IFC/Fragments viewer path.

This intentionally uses:

- `@thatopen/components`
- `@thatopen/components-front`
- `@thatopen/fragments`
- `OBC.IfcLoader`
- `OBC.FragmentsManager`
- `OBC.FastModelPickers`
- `OBF.Outliner`
- `OBF.PostproductionRenderer`
- ThatOpen's official Fragments worker
- `web-ifc` WASM through ThatOpen's loader setup

It intentionally does not use:

- SiloLink viewer code
- custom SiloLink edge generation
- Speckle code
- the `engine_web-ifc` basic Three.js demo path
- custom benchmark overlays

## Run

```bash
cd external/thatopen-ifc-viewer
pnpm install
pnpm dev -- --port 5188
```

Open:

```text
http://localhost:5188/
```

Use `Load IFC(s)` to select one or more local `.ifc` files. Files are read locally in the browser tab, converted through ThatOpen's `IfcLoader`, loaded into `FragmentsManager`, and added to a minimal ThatOpen scene. Each converted IFC exposes a per-model `Download` button for saving the same-name `.frag` file. Loading more files appends models to the current scene; use `Clear models` to reset the scene.

Use `Load FRAG(s)` to load `.frag` files directly through `fragments.core.load(...)`, skipping IFC conversion.

## Current Controls

- FPS monitor
- Renderer mode: automatic rendering or manual moving preview
- ThatOpen postproduction edges on/off
- Edge pass mode: `Default` or `Global`
- Fragments LOD mode: `Default`, `Full geometry`, or `All visible`
- Multi-model IFC loading
- Direct `.frag` loading
- Per-model `.frag` download and remove
- Fit camera
- Object picking with ThatOpen fast model picking
- Selection visualization with ThatOpen `Outliner`

Default startup mode is intentionally high pressure for benchmarking: ThatOpen postproduction edges are enabled in `Default` edge mode, and Fragments LOD starts at `All visible`.

The harness also sets `fragments.core.settings.maxUpdateRate = 0` so camera-driven updates are not skipped by the default 100ms Fragments update throttle.

## Notes

- This is meant to test the baseline ThatOpen Components/Fragments load, navigation, edge, and selection paths without SiloLink runtime code.
- The app currently fetches ThatOpen's Fragments worker from `https://thatopen.github.io/engine_fragment/resources/worker.mjs`.
- The IFC conversion uses `web-ifc@0.0.74` from unpkg, matching ThatOpen Components 3.3.x examples.
