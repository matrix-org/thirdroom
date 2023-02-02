import { ReactNode, InputHTMLAttributes, forwardRef } from "react";
import classNames from "classnames";

import "./Input.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  type?: "text" | "password" | "email" | "number" | "search";
  inputSize?: "sm" | "md" | "lg";
  state?: "success" | "error";
  outlined?: boolean;
  before?: ReactNode;
  after?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", inputSize = "md", state, outlined, size = 1, disabled, before, after, ...props },
    ref
  ) => {
    const inputClass = classNames(
      `Input Input--${inputSize}`,
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
        <input ref={ref} data-ui-state={state} type={type} size={size} disabled={disabled} {...props} />
        {after}
      </div>
    );
  }
);
