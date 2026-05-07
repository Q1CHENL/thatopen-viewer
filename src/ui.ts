import type { SelectedObject } from "./types";

export type ViewerUi = {
  container: HTMLElement;
  fpsValue: HTMLElement;
  rendererMode: HTMLSelectElement;
  edgesToggle: HTMLInputElement;
  edgeMode: HTMLSelectElement;
  lodMode: HTMLSelectElement;
  fileInput: HTMLInputElement;
  fragInput: HTMLInputElement;
  clearButton: HTMLButtonElement;
  fitButton: HTMLButtonElement;
  modelsList: HTMLElement;
  selectionOutput: HTMLElement;
  setStatus: (message: string) => void;
  setBusy: (busy: boolean) => void;
  renderSelectionMessage: (message: string) => void;
  renderSelectedObject: (selection: SelectedObject | null) => void;
};

const requireElement = <T extends HTMLElement>(id: string, expected: new () => T): T => {
  const element = document.getElementById(id);
  if (!(element instanceof expected)) {
    throw new Error(`Missing required DOM node: #${id}`);
  }
  return element;
};

export const createUi = (): ViewerUi => {
  const container = requireElement("container", HTMLDivElement);
  const fpsValue = requireElement("fps-value", HTMLElement);
  const rendererMode = requireElement("renderer-mode", HTMLSelectElement);
  const edgesToggle = requireElement("edges-toggle", HTMLInputElement);
  const edgeMode = requireElement("edge-mode", HTMLSelectElement);
  const lodMode = requireElement("lod-mode", HTMLSelectElement);
  const fileInput = requireElement("ifc-input", HTMLInputElement);
  const fragInput = requireElement("frag-input", HTMLInputElement);
  const clearButton = requireElement("clear-button", HTMLButtonElement);
  const fitButton = requireElement("fit-button", HTMLButtonElement);
  const modelsList = requireElement("models-list", HTMLElement);
  const selectionOutput = requireElement("selection-output", HTMLElement);
  const statusElement = requireElement("status", HTMLElement);

  const setStatus = (message: string) => {
    statusElement.textContent = message;
  };

  const setBusy = (busy: boolean) => {
    fileInput.disabled = busy;
    fragInput.disabled = busy;
    clearButton.disabled = busy;
    fitButton.disabled = busy;
  };

  const renderSelectionMessage = (message: string) => {
    selectionOutput.replaceChildren();
    selectionOutput.classList.add("empty");
    selectionOutput.textContent = message;
  };

  const renderSelectedObject = (selection: SelectedObject | null) => {
    if (!selection) {
      renderSelectionMessage("No object selected.");
      return;
    }

    selectionOutput.replaceChildren();
    selectionOutput.classList.remove("empty");

    const rows: Array<[string, string]> = [
      ["Model", selection.modelId],
      ["Local ID", String(selection.localId)],
    ];

    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "selection-row";

      const rowLabel = document.createElement("span");
      rowLabel.textContent = label;

      const rowValue = document.createElement("strong");
      rowValue.textContent = value;
      rowValue.title = value;

      row.append(rowLabel, rowValue);
      selectionOutput.append(row);
    }
  };

  return {
    container,
    fpsValue,
    rendererMode,
    edgesToggle,
    edgeMode,
    lodMode,
    fileInput,
    fragInput,
    clearButton,
    fitButton,
    modelsList,
    selectionOutput,
    setStatus,
    setBusy,
    renderSelectionMessage,
    renderSelectedObject,
  };
};
