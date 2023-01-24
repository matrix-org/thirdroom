import { FormEventHandler, ReactNode } from "react";
import classNames from "classnames";
import "./Content.css";

interface ContentProps {
  className?: string;
  top?: ReactNode;
  children?: ReactNode;
  bottom?: ReactNode;
  onSubmit?: FormEventHandler;
  onReset?: FormEventHandler;
}

export function Content({ className, top, children, bottom, onSubmit, onReset }: ContentProps) {
  const sectionClass = classNames("Content", className);

  const content = (
    <>
      {top && <div className="Content__top">{top}</div>}
      <div className="Content__children">{children}</div>
      {bottom && <div className="Content__bottom">{bottom}</div>}
    </>
  );

  if (onSubmit || onReset)
    return (
      <form onSubmit={onSubmit} onReset={onReset} className={sectionClass}>
        {content}
      </form>
    );
  return <div className={sectionClass}>{content}</div>;
}
