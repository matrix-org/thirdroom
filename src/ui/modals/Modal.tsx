import React, { ReactNode, SyntheticEvent, useCallback, useState } from "react";
import ReactModal from "react-modal";

export function useModal() {
  const [Modal, setModal] = useState<React.FC<ModalProps> | undefined>();

  const onRequestClose = useCallback(() => {
    setModal(undefined);
  }, []);

  return { Modal, setModal };
}

export interface ModalProps {
  isOpen: boolean;
  onRequestClose?: (
    event?:
      | SyntheticEvent<Element, MouseEvent>
      | SyntheticEvent<Element, KeyboardEvent>
  ) => void;
  children?: ReactNode;
}

export function Modal({ isOpen, onRequestClose, children }: ModalProps) {
  return (
    <ReactModal isOpen={isOpen} onRequestClose={onRequestClose}>
      {children}
    </ReactModal>
  );
}
