import { create } from "zustand";

import type { ViewerMode } from "../types";

type ViewerUiState = {
  isOpen: boolean;
  mode: ViewerMode;
  sourceFile: File | null;
  open: (mode: ViewerMode, file: File) => void;
  close: () => void;
  setMode: (mode: ViewerMode) => void;
};

export const useViewerUiStore = create<ViewerUiState>((set) => ({
  isOpen: false,
  mode: "preview",
  sourceFile: null,
  open: (mode, file) => set({ isOpen: true, mode, sourceFile: file }),
  close: () => set({ isOpen: false, mode: "preview" }),
  setMode: (mode) => set({ mode }),
}));
