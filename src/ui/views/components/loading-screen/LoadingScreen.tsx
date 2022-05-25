import { ReactNode } from "react";

import "./LoadingScreen.css";

interface LoadingScreenProps {
  children: ReactNode;
}

export function LoadingScreen({ children }: LoadingScreenProps) {
  return <div className="LoadingScreen flex flex-column justify-center items-center">{children}</div>;
}
