import { useState } from "react";

import { ColorInput } from "./ColorInput";

export const title = "ColorInput";

export default function ColorInputStories() {
  const [rgb, setRGB] = useState(new Float32Array(3));
  const [rgba, setRGBA] = useState(new Float32Array(4));

  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <ColorInput value={rgb} type="rgb" onChange={setRGB} />
      <ColorInput value={rgba} type="rgba" onChange={setRGBA} />
    </div>
  );
}
