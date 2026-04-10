import { useModalStore } from "@/stores/modal-store";


export const useModal = () => {
  const { openModal, closeModal, state } = useModalStore();

  return {
    openModal,
    closeModal,
    isOpen: state.isOpen,
  };
};