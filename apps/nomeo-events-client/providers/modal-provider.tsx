import { Modal } from "@/components/ui/modal";
import { ReactNode } from "react";

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <Modal />
    </>
  );
};