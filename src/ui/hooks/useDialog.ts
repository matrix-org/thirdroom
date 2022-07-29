import { useCallback, useState } from "react";

export function useDialog(isOpen: boolean) {
  const [open, setOpen] = useState(isOpen);
  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);
  return { open, setOpen, openDialog, closeDialog };
}
