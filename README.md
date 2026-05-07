# ThatOpen Viewer

A small ThatOpen-based IFC and Fragments viewer.

It uses:

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

## Run

```bash
cd thatopen-viewer
pnpm install
pnpm dev
```

Open:

```text
http://localhost:5188/
```

Use `Load IFC(s)` to select one or more local `.ifc` files. Files are read locally in the browser tab, converted through ThatOpen's `IfcLoader`, loaded into `FragmentsManager`, and added to the scene. Each converted IFC exposes a per-model `Download` button for saving the same-name `.frag` file. Loading more files appends models to the current scene; use `Clear models` to reset the scene.

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

Default startup mode enables ThatOpen postproduction edges in `Default` edge mode, and Fragments LOD starts at `All visible`.

The viewer also sets `fragments.core.settings.maxUpdateRate = 0` so camera-driven updates are not skipped by the default 100ms Fragments update throttle.

## Notes

- The app currently fetches ThatOpen's Fragments worker from `https://thatopen.github.io/engine_fragment/resources/worker.mjs`.
- The IFC conversion uses `web-ifc@0.0.74` from unpkg, matching ThatOpen Components 3.3.x examples.
