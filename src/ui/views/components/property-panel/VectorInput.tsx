import { Label } from "../../../atoms/text/Label";
import { NumericInput } from "../../../atoms/input/NumericInput";

interface VectorInputProps {
  type: "vec2" | "vec3";
  value: Float32Array;
  onChange: (value: Float32Array) => void;
  disabled?: boolean;
}

export function VectorInput({ value, type, onChange, disabled }: VectorInputProps) {
  const [x = 0, y = 0, z = 0] = value;

  const handleChange = (x: number, y: number, z: number) => {
    const values = [x, y];
    if (type == "vec3") values.push(z);
    onChange(new Float32Array(values));
  };

  return (
    <div className="flex items-center grow gap-xs">
      <NumericInput
        before={
          <Label color="surface-low" className="shrink-0">
            X
          </Label>
        }
        className="flex grow basis-0"
        type="f32"
        value={x}
        displayPrecision={3}
        inputSize="sm"
        onChange={(value) => handleChange(value, y, z)}
        outlined
        disabled={disabled}
      />
      <NumericInput
        before={
          <Label color="surface-low" className="shrink-0">
            Y
          </Label>
        }
        className="flex grow basis-0"
        type="f32"
        value={y}
        displayPrecision={3}
        inputSize="sm"
        onChange={(value) => handleChange(x, value, z)}
        outlined
        disabled={disabled}
      />
      {type === "vec3" && (
        <>
          <NumericInput
            before={
              <Label color="surface-low" className="shrink-0">
                Z
              </Label>
            }
            className="flex grow basis-0"
            type="f32"
            value={z}
            displayPrecision={3}
            inputSize="sm"
            onChange={(value) => handleChange(x, y, value)}
            outlined
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}
