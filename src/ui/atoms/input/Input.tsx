import classNames from "classnames";

import "./Input.css";

interface IInput {
  id?: string;
  className?: string;
  name?: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "number" | "search";
  inputSize?: "sm" | "md";
  state?: "success" | "error";
  value?: string | number;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: "on" | "off";
  autoFocus?: boolean;
  readonly?: boolean;
  size?: number;
}

export function Input({
  id,
  className,
  name,
  placeholder,
  type = "text",
  inputSize = "md",
  state,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  autoComplete = "off",
  autoFocus = false,
  readonly,
  size = 1,
}: IInput) {
  const inputClass = classNames(`Input Input-${inputSize}`, className, {
    "Input--success": state === "success",
    "Input--error": state === "error",
  });

  return (
    <input
      className={inputClass}
      id={id}
      name={name}
      placeholder={placeholder}
      type={type}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      readOnly={readonly}
      size={size}
    />
  );
}
