import { ReactNode } from "react";
import "./Storybook.css";

export default function Storybook({ children }: { children: ReactNode }) {
  return <div className="Storybook">{children}</div>;
}
