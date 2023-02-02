import { useState } from "react";

import { VectorInput } from "./VectorInput";

export const title = "VectorInput";

export default function VectorInputStories() {
  const [v3, setV3] = useState(new Float32Array(3));
  const [v2, setV2] = useState(new Float32Array(2));

  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <VectorInput value={v2} type="vec2" onChange={setV2} />
      <VectorInput value={v3} type="vec3" onChange={setV3} />
    </div>
  );
}
