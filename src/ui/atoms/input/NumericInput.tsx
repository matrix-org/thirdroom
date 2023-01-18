import { ChangeEvent, FocusEventHandler, KeyboardEvent, useEffect, useRef, useState } from "react";

import { Input, InputProps } from "./Input";

interface NumericInputProps extends Omit<InputProps, "type" | "onChange" | "step"> {
  type?: "u32" | "f32";
  smStep?: number;
  mdStep?: number;
  lgStep?: number;
  displayPrecision?: number; // Floating point digits to display when not focused
  roundPrecision?: number; // Max digits to round to when changed (0 means integer?)
  forwardRef?: HTMLInputElement | null;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}

export function NumericInput({
  type = "u32", // TODO:
  smStep,
  mdStep,
  lgStep,
  displayPrecision, // TODO:
  roundPrecision, // TODO:
  defaultValue,
  value,
  onChange,
  onKeyDown,
  onBlur,
  forwardRef,
  ...props
}: NumericInputProps) {
  const [inputValue, setInputValue] = useState(value ?? defaultValue ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (value) setInputValue(value);
  }, [value]);

  const getIncomingValue = (): number => {
    return value ?? defaultValue ?? 0;
  };

  const getCurrentValue = (): number => {
    if (inputRef.current) {
      const value = inputRef.current.value;
      const currentValue = value.includes(".") ? parseFloat(value) : parseInt(value);
      if (isNaN(currentValue)) return getIncomingValue();
      return currentValue;
    }
    return getIncomingValue();
  };

  const getStep = (ctrl: boolean, shift: boolean, dir: "f" | "b"): number => {
    let nextStep = mdStep ?? 1;
    if (ctrl && smStep) nextStep = smStep;
    if (shift && lgStep) nextStep = lgStep;
    return dir === "f" ? nextStep : -1 * nextStep;
  };

  console.log(inputValue, "-=");
  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setInputValue(evt.currentTarget.value);
    console.log(evt.currentTarget.value);
  };

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(evt);

    if (evt.key === "Backspace") return;
    if (evt.key === "Escape" && inputRef.current) {
      inputRef.current.value = getIncomingValue().toString();
      inputRef.current.blur();
      return;
    }
    if (evt.key === "Enter") {
      onChange?.(getCurrentValue());
      return;
    }
    if (evt.key === "ArrowUp" || evt.key === "ArrowDown") {
      const nextStep = getStep(evt.ctrlKey || evt.altKey, evt.shiftKey, evt.key === "ArrowUp" ? "f" : "b");
      onChange?.(getCurrentValue() + nextStep);
      evt.preventDefault();
      return;
    }
    if (!evt.key.match(/^[\d\\.]$/)) {
      evt.preventDefault();
    }
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (evt) => {
    onBlur?.(evt);
    const oldValue = getIncomingValue();
    const newValue = getCurrentValue();
    if (oldValue !== newValue) {
      onChange?.(newValue);
    }
  };

  return (
    <Input
      ref={(ref) => {
        forwardRef = ref;
        inputRef.current = ref;
      }}
      type="number"
      defaultValue={defaultValue}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      {...props}
    />
  );
}
