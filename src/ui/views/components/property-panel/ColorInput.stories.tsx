import { useState } from "react";
import { Meta } from "@storybook/react";

import { ColorInput } from "./ColorInput";

export default {
  title: "ColorInput",
  component: ColorInput,
} as Meta<typeof ColorInput>;

export function ColorInputStories() {
  const [rgb, setRGB] = useState(new Float32Array(3));
  const [rgba, setRGBA] = useState(new Float32Array(4));

  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <ColorInput value={rgb} type="rgb" onChange={setRGB} />
      <ColorInput value={rgba} type="rgba" onChange={setRGBA} />
    </div>
  );
}
