import classNames from "classnames";

import { Content } from "../../../atoms/content/Content";
import "./Window.css";

interface WindowProps {
  className?: string;
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Window({ className, header, footer, children }: WindowProps) {
  const windowClass = classNames("Window", className);

  return (
    <Content className={windowClass} top={header} bottom={footer}>
      {children}
    </Content>
  );
}
