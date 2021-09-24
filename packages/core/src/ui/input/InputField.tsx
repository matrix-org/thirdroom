import React, { InputHTMLAttributes, forwardRef } from "react";
import { ErrorMessage, ErrorMessageValue } from "./ErrorMessage";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
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
				<div className="input-container">
					<label htmlFor={name}>{label}</label>
					{prefix && <span>{prefix}</span>}
					<input name={name} ref={ref} {...rest}></input>
					{postfix && <span>{postfix}</span>}
				</div>
        {error && <ErrorMessage name={label} error={error} />}
      </div>
    );
  }
);
