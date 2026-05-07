export const toArrayBuffer = (buffer: ArrayBuffer | ArrayBufferView): ArrayBuffer => {
  if (buffer instanceof ArrayBuffer) {
    return buffer.slice(0);
  }

  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
};

export const cloneArrayBuffer = (buffer: ArrayBuffer) => buffer.slice(0);

export const fragFileNameFromIfc = (fileName: string) => fileName.replace(/\.ifc$/i, ".frag");

export const modelIdFromFile = (file: File, existingIds: Set<string>) => {
  const stem = file.name.replace(/\.(ifc|frag)$/i, "");
  const safeStem = stem.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "");
  const baseId = safeStem || `ifc-${Date.now()}`;
  let modelId = baseId;
  let index = 2;

  while (existingIds.has(modelId)) {
    modelId = `${baseId}-${index}`;
    index += 1;
  }

  existingIds.add(modelId);
  return modelId;
};

export const runAfterNextPaint = (callback: () => void) => {
  requestAnimationFrame(() => {
    window.setTimeout(callback, 0);
  });
};

export const downloadFile = (fileName: string, buffer: ArrayBuffer | ArrayBufferView) => {
  const blob = new Blob([toArrayBuffer(buffer)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

