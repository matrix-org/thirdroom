import { forwardRef, ReactNode } from "react";
import { RgbColor, RgbaColor, RgbColorPicker, RgbaColorPicker } from "react-colorful";
import * as Popover from "@radix-ui/react-popover";

import { Label } from "../../../atoms/text/Label";
import { NumericInput } from "../../../atoms/input/NumericInput";
import "./ColorInput.css";

type ColorPreviewProps = {
  label: string;
  color: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  onClick?: () => void;
};

export const ColorPreview = forwardRef<HTMLButtonElement, ColorPreviewProps>(({ label, color, onClick }, ref) => (
  <button aria-label={label} className="ColorPreview" onClick={onClick} ref={ref}>
    <span style={{ backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})` }} />
  </button>
));

type ColorType = "rgb" | "rgba";
type ColorInputProps<T extends ColorType> = T extends "rgb"
  ? {
      type: T;
      value: RgbColor;
      onChange: (value: RgbColor) => void;
    }
  : {
      type: T;
      value: RgbaColor;
      onChange: (value: RgbaColor) => void;
    };

type ColorPickerProps<T extends ColorType> = ColorInputProps<T> & {
  children: ReactNode;
};

export function ColorPicker<T extends ColorType>({ type, value, onChange, children }: ColorPickerProps<T>) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={5}>
          {type === "rgb" ? (
            <RgbColorPicker color={value} onChange={onChange} />
          ) : (
            <RgbaColorPicker color={value} onChange={onChange} />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ColorInput<T extends ColorType>({
  value,
  type,
  onChange,
  picker,
}: ColorInputProps<T> & { picker: ReactNode }) {
  return (
    <div className="flex items-center grow gap-xs">
      <NumericInput
        before={
          <Label color="surface-low" className="shrink-0">
            R
          </Label>
        }
        className="flex grow basis-0"
        type="u32"
        min={0}
        max={255}
        value={value.r}
        inputSize="sm"
        onChange={(r) => onChange({ ...value, r } as typeof type extends "rgb" ? RgbColor : RgbaColor)}
      />

      <NumericInput
        before={
          <Label color="surface-low" className="shrink-0">
            G
          </Label>
        }
        className="flex grow basis-0"
        type="u32"
        min={0}
        max={255}
        value={value.g}
        inputSize="sm"
        onChange={(g) => onChange({ ...value, g } as typeof type extends "rgb" ? RgbColor : RgbaColor)}
      />

      <NumericInput
        before={
          <Label color="surface-low" className="shrink-0">
            B
          </Label>
        }
        className="flex grow basis-0"
        type="u32"
        min={0}
        max={255}
        value={value.b}
        inputSize="sm"
        onChange={(b) => onChange({ ...value, b } as typeof type extends "rgb" ? RgbColor : RgbaColor)}
      />
      {type === "rgba" && (
        <>
          <NumericInput
            before={
              <Label color="surface-low" className="shrink-0">
                A
              </Label>
            }
            className="flex grow basis-0"
            type="f32"
            min={0}
            max={1}
            displayPrecision={3}
            mdStep={0.1}
            value={value.a}
            inputSize="sm"
            onChange={(a) => onChange({ ...value, a })}
          />
        </>
      )}
      {picker}
    </div>
  );
}
