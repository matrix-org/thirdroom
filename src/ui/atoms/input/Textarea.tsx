import { ReactNode, forwardRef, TextareaHTMLAttributes } from "react";
import classNames from "classnames";

import "./Input.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  size?: "sm" | "md" | "lg";
  state?: "success" | "error";
  outlined?: boolean;
  before?: ReactNode;
  after?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "md", state, outlined, disabled, before, after, ...props }, ref) => {
    const inputClass = classNames(
      `Input Input--${size}`,
      {
        "Input--success": state === "success",
        "Input--error": state === "error",
        "Input--disabled": disabled,
        "Input--outlined": outlined,
      },
      className
    );

    return (
      <div className={inputClass}>
        {before}
        <textarea ref={ref} data-ui-state={state} disabled={disabled} {...props} />
        {after}
      </div>
    );
  }
);
