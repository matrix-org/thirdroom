import { ChangeEvent, FocusEventHandler, KeyboardEvent, RefObject, useEffect, useRef, useState } from "react";

import { Input, InputProps } from "./Input";

type InputType = "u32" | "f32";
type StepType = "sm" | "md" | "lg";
interface NumericInputProps extends Omit<InputProps, "type" | "onChange" | "step" | "defaultValue"> {
  type?: InputType;
  smStep?: number;
  mdStep?: number;
  lgStep?: number;
  floatPrecision?: number;
  displayPrecision?: number;
  forwardRef?: HTMLInputElement | null;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
}

export function strToFixed(str: string, digits?: number): string {
  if (typeof digits !== "number" || digits < 0) return str;
  const pointIndex = str.indexOf(".");
  if (pointIndex < 0) return str;
  if (pointIndex === str.length - 1 || digits === 0) return str.slice(0, pointIndex);
  return str.slice(0, pointIndex + 1 + digits);
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
    if (type === "u32" && v < 0) {
      v = 0;
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
  displayPrecision,
  min,
  max,
  value,
  onChange,
  onKeyDown,
  onBlur,
  onFocus,
  forwardRef,
  ...props
}: NumericInputProps) {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focus, setFocus] = useState(false);
  const { getCurrentValue, constrainValue } = useValue(inputRef, type, floatPrecision, min, max);
  const { getStep, getStepType } = useStep(smStep, mdStep, lgStep);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setLocalValue(evt.currentTarget.value);
  };

  const saveValue = (newValue?: number) => {
    const constrainedValue = constrainValue(newValue);
    setLocalValue(constrainedValue?.toString() ?? value.toString());
    if (typeof constrainedValue === "number") {
      onChange(constrainedValue);
    }
  };

  const restoreValue = () => {
    setLocalValue(value.toString());
  };

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(evt);

    if (evt.key === "Escape") {
      restoreValue();
      setTimeout(() => {
        // Set timeout so handleBlur won't save edited value.
        inputRef.current?.blur();
      }, 100);
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
    setFocus(false);
    saveValue(getCurrentValue());
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = (evt) => {
    onFocus?.(evt);
    setFocus(true);
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
      value={
        focus === false && typeof displayPrecision === "number" ? strToFixed(localValue, displayPrecision) : localValue
      }
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...props}
    />
  );
}
