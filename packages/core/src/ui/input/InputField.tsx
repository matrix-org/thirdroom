import React, { InputHTMLAttributes, forwardRef } from "react";
import { ErrorMessage, ErrorMessageValue } from "./ErrorMessage";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  prefix?: string;
  postfix?: string;
  error?: ErrorMessageValue;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, name, label, error, prefix, postfix, ...rest }, ref) => {
    return (
      <div className={className}>
        <label htmlFor={name}>{label}</label>
        <div>
          {prefix && <span>{prefix}</span>}
          <input name={name} ref={ref} {...rest}></input>
          {postfix && <span>{postfix}</span>}
        </div>
        {error && <ErrorMessage name={label} error={error} />}
      </div>
    );
  }
);
