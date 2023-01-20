import { Label } from "../../../atoms/text/Label";
import { NumericInput } from "../../../atoms/input/NumericInput";

interface VectorInputProps {
  type: "vec2" | "vec3";
  value: Float32Array;
  onChange: (value: Float32Array) => void;
}

export function VectorInput({ value, type, onChange }: VectorInputProps) {
  const [x = 0, y = 0, z = 0] = value;

  const handleChange = (x: number, y: number, z: number) => {
    const values = [x, y];
    if (type == "vec3") values.push(z);
    onChange(new Float32Array(values));
  };

  return (
    <div className="flex items-center grow gap-xs">
      <Label className="shrink-0">X:</Label>
      <NumericInput
        className="flex grow"
        type="f32"
        value={x}
        displayPrecision={3}
        inputSize="sm"
        onChange={(value) => handleChange(value, y, z)}
      />
      <Label className="shrink-0">Y:</Label>
      <NumericInput
        className="flex grow"
        type="f32"
        value={y}
        displayPrecision={3}
        inputSize="sm"
        onChange={(value) => handleChange(x, value, z)}
      />
      {type === "vec3" && (
        <>
          <Label className="shrink-0">Z:</Label>
          <NumericInput
            className="flex grow"
            type="f32"
            value={z}
            displayPrecision={3}
            inputSize="sm"
            onChange={(value) => handleChange(x, y, value)}
          />
        </>
      )}
    </div>
  );
}
