import { ReactNode } from "react";

export type ModalSize = "small" | "medium" | "large" | "extra-large" | "extremely-large";

export interface OpenModalOptions {
  title: string;
  description?: string;
  icon?: any;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  children: ReactNode;
  onClose?: () => void;
}

export interface ModalState {
  isOpen: boolean;
  title: string;
  description?: string;
  icon?: any;
  size: ModalSize;
  showCloseButton: boolean;
  closeOnEsc: boolean;
  closeOnOutsideClick: boolean;
  children: ReactNode | null;
  onClose?: () => void;
}

export interface ModalHeaderProps {
  title: string;
  description?: string;
  icon?: any;
  showCloseButton: boolean;
  onClose: () => void;
  size: ModalSize;
}

export interface ModalContentProps {
  children: ReactNode;
  size: ModalSize;
}