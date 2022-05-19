import { FormEventHandler, ReactNode } from "react";
import classNames from "classnames";
import "./Content.css";

interface ContentProps {
  className?: string;
  top?: ReactNode;
  children?: ReactNode;
  bottom?: ReactNode;
  onSubmit?: FormEventHandler;
}

export function Content({ className, top, children, bottom, onSubmit }: ContentProps) {
  const sectionClass = classNames("Content", className);

  const content = (
    <>
      {top && <div className="Content__top">{top}</div>}
      {children && <div className="Content__children">{children}</div>}
      {bottom && <div className="Content__bottom">{bottom}</div>}
    </>
  );

  if (onSubmit) return <form className={sectionClass}>{content}</form>;
  return <div className={sectionClass}>{content}</div>;
}
