import { ModalState, OpenModalOptions } from "@/types/modal-type";
import { create } from "zustand";

const initialState: ModalState = {
  isOpen: false,
  title: "",
  description: undefined,
  icon: undefined,
  size: "medium",
  showCloseButton: true,
  closeOnEsc: true,
  closeOnOutsideClick: true,
  children: null,
  onClose: undefined,
};

interface ModalStore {
  state: ModalState;
  openModal: (options: OpenModalOptions) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  state: initialState,

  openModal: (options) => {
    set({
      state: {
        isOpen: true,
        title: options.title,
        description: options.description,
        icon: options.icon,
        size: options.size || "medium",
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true,
        closeOnEsc: options.closeOnEsc !== undefined ? options.closeOnEsc : true,
        closeOnOutsideClick: options.closeOnOutsideClick !== undefined ? options.closeOnOutsideClick : true,
        children: options.children,
        onClose: options.onClose,
      },
    });
  },

  closeModal: () => {
    set((state) => {
      if (state.state.onClose) {
        state.state.onClose();
      }
      return {
        state: { ...initialState, isOpen: false },
      };
    });
  },
}));