import { ChangeEvent, FocusEventHandler, KeyboardEvent, RefObject, useEffect, useRef, useState } from "react";

import { Input, InputProps } from "./Input";

type InputType = "u32" | "f32";
type StepType = "sm" | "md" | "lg";
interface NumericInputProps extends Omit<InputProps, "type" | "onChange" | "step" | "defaultValue"> {
  type?: InputType;
  smStep?: number;
  mdStep?: number;
  lgStep?: number;
  floatPrecision?: number; // Max digits to round to when changed (0 means integer?)
  forwardRef?: HTMLInputElement | null;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
}

function useValue(
  inputRef: RefObject<HTMLInputElement | null>,
  type: InputType,
  floatPrecision?: number,
  min?: number,
  max?: number
) {
  const getCurrentValue = (): number | undefined => {
    if (inputRef.current) {
      const value = inputRef.current.value.replace(/\s/g, "");
      const currentValue = value.includes(".") ? parseFloat(value) : parseInt(value);
      if (isNaN(currentValue)) return undefined;
      return currentValue;
    }
    return undefined;
  };

  const constrainValue = (value?: number) => {
    if (typeof value !== "number") return undefined;
    let v = value;
    if (type !== "f32") {
      v = Math.round(v);
    }
    if (type === "u32") {
      v = Math.abs(v);
    }
    if (type == "f32" && typeof floatPrecision === "number") {
      v = parseFloat(v.toFixed(floatPrecision));
    }
    if (typeof min === "number" && v < min) return min;
    if (typeof max === "number" && v > max) return max;
    return v;
  };

  return {
    getCurrentValue,
    constrainValue,
  };
}

function useStep(smStep?: number, mdStep?: number, lgStep?: number) {
  const getStep = (stepType: StepType, backwards: boolean): number => {
    let nextStep = mdStep ?? 1;
    if (stepType === "sm" && smStep) nextStep = smStep;
    if (stepType === "lg" && lgStep) nextStep = lgStep;
    return backwards ? -1 * nextStep : nextStep;
  };

  const getStepType = (evt: KeyboardEvent<HTMLInputElement>): StepType => {
    let stepType: StepType = "md";
    if (evt.shiftKey) stepType = "lg";
    else if (evt.ctrlKey) stepType = "sm";

    return stepType;
  };

  return {
    getStep,
    getStepType,
  };
}

export function NumericInput({
  type = "u32",
  smStep,
  mdStep,
  lgStep,
  floatPrecision,
  min,
  max,
  value,
  onChange,
  onKeyDown,
  onBlur,
  forwardRef,
  ...props
}: NumericInputProps) {
  const [localValue, setLocalValue] = useState<number | string>(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { getCurrentValue, constrainValue } = useValue(inputRef, type, floatPrecision, min, max);
  const { getStep, getStepType } = useStep(smStep, mdStep, lgStep);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setLocalValue(evt.currentTarget.value);
  };

  const saveValue = (newValue?: number) => {
    const constrainedValue = constrainValue(newValue);
    setLocalValue(constrainedValue ?? value);
    if (typeof constrainedValue === "number") {
      onChange(constrainedValue);
    }
  };

  const restoreValue = () => {
    setLocalValue(value);
  };

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(evt);

    if (evt.key === "Escape" && inputRef.current) {
      restoreValue();
      inputRef.current.blur();
      return;
    }
    if (evt.key === "Enter") {
      saveValue(getCurrentValue());
      return;
    }
    if (evt.key === "ArrowUp" || evt.key === "ArrowDown") {
      const nextStep = getStep(getStepType(evt), evt.key === "ArrowDown");
      saveValue((getCurrentValue() ?? 0) + nextStep);
      evt.preventDefault();
      return;
    }
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (evt) => {
    onBlur?.(evt);
    saveValue(getCurrentValue());
  };

  return (
    <Input
      ref={(ref) => {
        forwardRef = ref;
        inputRef.current = ref;
      }}
      type="text"
      min={min}
      max={max}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      {...props}
    />
  );
}
