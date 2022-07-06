import { ReactNode } from "react";

import "./ChatView.css";

interface ChatViewProps {
  children: ReactNode;
}

export function ChatView({ children }: ChatViewProps) {
  return <div className="ChatView flex flex-column">{children}</div>;
}
