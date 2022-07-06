import classNames from "classnames";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import "./Dialog.css";

interface DialogProps {
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  children: ReactNode;
}

export function Dialog({ className, defaultOpen, open, onOpenChange, trigger, children }: DialogProps) {
  return (
    <RadixDialog.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <RadixDialog.Trigger asChild>
          <span>{trigger}</span>
        </RadixDialog.Trigger>
      )}
      <RadixDialog.Portal container={document.body}>
        <RadixDialog.Overlay className="Dialog__overlay" />
        <RadixDialog.Content className={classNames("Dialog", className)}>{children}</RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
