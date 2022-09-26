import classNames from "classnames";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  className?: string;
  overlayClassName?: string;
  size?: "md" | "sm";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  children: ReactNode;
}

export function Modal({
  className,
  overlayClassName,
  size = "md",
  defaultOpen,
  open,
  onOpenChange,
  trigger,
  children,
}: ModalProps) {
  return (
    <RadixDialog.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <RadixDialog.Trigger asChild>
          <span>{trigger}</span>
        </RadixDialog.Trigger>
      )}
      <RadixDialog.Portal container={document.body}>
        <RadixDialog.Overlay className={classNames("Modal__overlay", overlayClassName)} />
        <RadixDialog.Content className={classNames("Modal", `Modal--${size}`, className)}>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
