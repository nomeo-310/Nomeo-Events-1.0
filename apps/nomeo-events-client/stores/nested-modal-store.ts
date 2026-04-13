// stores/nested-modal-store.ts
import { create } from "zustand";
import { ReactNode } from "react";

export type NestedModalSize = "small" | "medium" | "large" | "extra-large" | "extremely-large";

interface NestedModalState {
  isOpen: boolean;
  title: string;
  description?: string;
  icon?: any;
  size: NestedModalSize;
  children: ReactNode | null;
  showCloseButton: boolean;
  closeOnEsc: boolean;
  closeOnOutsideClick: boolean;
}

interface NestedModalStore {
  state: NestedModalState;
  openNestedModal: (options: {
    title: string;
    description?: string;
    icon?: any;
    size?: NestedModalSize;
    showCloseButton?: boolean;
    closeOnEsc?: boolean;
    closeOnOutsideClick?: boolean;
    children: ReactNode;
  }) => void;
  closeNestedModal: () => void;
}

const initialState: NestedModalState = {
  isOpen: false,
  title: "",
  description: undefined,
  icon: undefined,
  size: "large",
  children: null,
  showCloseButton: true,
  closeOnEsc: true,
  closeOnOutsideClick: true,
};

export const useNestedModalStore = create<NestedModalStore>((set) => ({
  state: initialState,

  openNestedModal: (options) => {
    set({
      state: {
        isOpen: true,
        title: options.title,
        description: options.description,
        icon: options.icon,
        size: options.size || "large",
        children: options.children,
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true,
        closeOnEsc: options.closeOnEsc !== undefined ? options.closeOnEsc : true,
        closeOnOutsideClick: options.closeOnOutsideClick !== undefined ? options.closeOnOutsideClick : true,
      },
    });
  },

  closeNestedModal: () => {
    set({
      state: { ...initialState, isOpen: false },
    });
  },
}));