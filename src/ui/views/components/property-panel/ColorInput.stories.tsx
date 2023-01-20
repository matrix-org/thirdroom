import { useState } from "react";

import { ColorInput, ColorPicker, ColorPreview } from "./ColorInput";

export const title = "ColorInput";

export default function ColorInputStories() {
  const [rgb, setRGB] = useState({ r: 0, g: 0, b: 0 });
  const [rgba, setRGBA] = useState({ r: 0, g: 0, b: 0, a: 1 });

  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <ColorInput
        value={rgb}
        type="rgb"
        onChange={setRGB}
        picker={
          <ColorPicker type="rgb" value={rgb} onChange={setRGB}>
            <ColorPreview label="Pick Color" color={rgb} />
          </ColorPicker>
        }
      />
      <ColorInput
        value={rgba}
        type="rgba"
        onChange={setRGBA}
        picker={
          <ColorPicker type="rgba" value={rgba} onChange={setRGBA}>
            <ColorPreview label="Pick Color" color={rgba} />
          </ColorPicker>
        }
      />
    </div>
  );
}
