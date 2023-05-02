import { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  container?: Element;
  children: ReactNode;
}

export function Portal({ children, container }: PortalProps) {
  return createPortal(children, container ?? document.body);
}
