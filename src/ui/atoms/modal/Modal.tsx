import classNames from "classnames";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  content: ReactNode;
  children: ReactNode;
}

export function Modal({ className, defaultOpen, open, onOpenChange, content, children }: ModalProps) {
  return (
    <RadixDialog.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>
        <span>{children}</span>
      </RadixDialog.Trigger>
      <RadixDialog.Portal container={document.body}>
        <RadixDialog.Overlay className="Modal__overlay" />
        <RadixDialog.Content className={classNames("Modal", className)}>{content}</RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
