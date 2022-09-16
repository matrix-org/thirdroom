import { ReactNode } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import CrossIC from "../../../../../res/ic/cross.svg";

interface AlertDialogProps {
  open: boolean;
  title: string;
  content: ReactNode;
  buttons?: ReactNode;
  closeable?: boolean;
  requestClose: () => void;
}

export function AlertDialog({ open, title, content, buttons, closeable = true, requestClose }: AlertDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <Header
        className="shrink-0"
        left={<HeaderTitle size="lg">{title}</HeaderTitle>}
        right={closeable && <IconButton iconSrc={CrossIC} onClick={requestClose} label="Close" />}
      />
      <div className="flex flex-column gap-md" style={{ padding: "0 var(--sp-md) var(--sp-md)" }}>
        <div>{content}</div>
        {buttons && <div className="flex flex-column gap-sm">{buttons}</div>}
      </div>
    </Dialog>
  );
}
