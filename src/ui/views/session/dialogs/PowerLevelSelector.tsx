import { NumericInput } from "../../../atoms/input/NumericInput";
import { MenuItem } from "../../../atoms/menu/MenuItem";
import { Label } from "../../../atoms/text/Label";

interface PowerLevelSelectorProps {
  value: number;
  max: number;
  onSelect: (value: number) => void;
}

export function PowerLevelSelector({ value, max, onSelect }: PowerLevelSelectorProps) {
  const handleSubmit = (powerLevel: number) => {
    if (!powerLevel) return;
    onSelect(powerLevel);
  };

  return (
    <div className="power-level-selector flex flex-column gap-md">
      <div className="flex flex-column gap-xxs" style={{ padding: "0 var(--sp-md)" }}>
        <Label>Select Power Level</Label>
        <NumericInput
          value={value}
          type="u32"
          onChange={handleSubmit}
          max={max}
          mdStep={1}
          smStep={5}
          lgStep={10}
          placeholder="Power level"
          autoComplete="off"
          required
        />
      </div>
      <div>
        {max >= 0 && <Label style={{ padding: "0 var(--sp-md)" }}>Presets</Label>}
        {max >= 100 && (
          <MenuItem variant={value === 100 ? "primary" : "surface"} onClick={() => onSelect(100)}>
            Admin - 100
          </MenuItem>
        )}
        {max >= 50 && (
          <MenuItem variant={value === 50 ? "primary" : "surface"} onClick={() => onSelect(50)}>
            Mod - 50
          </MenuItem>
        )}
        {max >= 0 && (
          <MenuItem variant={value === 0 ? "primary" : "surface"} onClick={() => onSelect(0)}>
            Member - 0
          </MenuItem>
        )}
      </div>
    </div>
  );
}
