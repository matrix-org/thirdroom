import { Label } from "../text/Label";
import { Input } from "./Input";

interface Vector3InputProps {
  value: Float32Array | undefined;
  onChange: (value: Float32Array) => void;
}

export function Vector3Input({ value, onChange }: Vector3InputProps) {
  const [x, y, z] = value || new Float32Array(3);

  return (
    <div className="flex items-center grow gap-xxs">
      <Label className="shrink-0">X:</Label>
      <Input
        className="flex grow"
        type="text"
        value={x}
        inputSize="sm"
        onChange={(e) => onChange(new Float32Array([parseFloat(e.target.value) || 0, y, z]))}
      />
      <Label className="shrink-0">Y:</Label>
      <Input
        className="flex grow"
        type="text"
        value={y}
        inputSize="sm"
        onChange={(e) => onChange(new Float32Array([x, parseFloat(e.target.value) || 0, z]))}
      />
      <Label className="shrink-0">Z:</Label>
      <Input
        className="flex grow"
        type="text"
        value={z}
        inputSize="sm"
        onChange={(e) => onChange(new Float32Array([x, y, parseFloat(e.target.value) || 0]))}
      />
    </div>
  );
}
