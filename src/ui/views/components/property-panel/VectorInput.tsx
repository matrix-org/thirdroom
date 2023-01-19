import { Label } from "../../../atoms/text/Label";
import { NumericInput } from "../../../atoms/input/NumericInput";

interface VectorInputProps {
  type: "vec2" | "vec3";
  value: Float32Array | undefined;
  onChange: (value: Float32Array) => void;
}

export function VectorInput({ value, type, onChange }: VectorInputProps) {
  const [x, y, z] = value || new Float32Array(3);

  const handleChange = (values: number[]) => {
    onChange(new Float32Array(values));
  };

  return (
    <div className="flex items-center grow gap-xs">
      <Label className="shrink-0">X:</Label>
      <NumericInput
        className="flex grow"
        type="f32"
        value={x}
        inputSize="sm"
        onChange={(value) => handleChange([value, y, z])}
      />
      <Label className="shrink-0">Y:</Label>
      <NumericInput
        className="flex grow"
        type="f32"
        value={y}
        inputSize="sm"
        onChange={(value) => handleChange([x, value, z])}
      />
      {type === "vec3" && (
        <>
          <Label className="shrink-0">Z:</Label>
          <NumericInput
            className="flex grow"
            type="f32"
            value={z}
            inputSize="sm"
            onChange={(value) => handleChange([x, y, value])}
          />
        </>
      )}
    </div>
  );
}
