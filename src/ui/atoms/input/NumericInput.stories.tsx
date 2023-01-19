import { useState } from "react";

import { NumericInput } from "./NumericInput";
import { Text } from "../text/Text";

export const title = "NumericInput";

export default function NumericInputStories() {
  const [f32, setF32] = useState<number>(10.32);
  const [u32, setU32] = useState<number>(10);

  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <NumericInput
        before={
          <Text variant="b3" color="surface-low">
            f32
          </Text>
        }
        inputSize="sm"
        type="f32"
        floatPrecision={2}
        smStep={0.5}
        mdStep={1}
        lgStep={2.5}
        max={20}
        min={0}
        outlined
        value={f32}
        onChange={setF32}
      />
      <NumericInput
        before={
          <Text variant="b3" color="surface-low">
            u32
          </Text>
        }
        inputSize="sm"
        type="u32"
        floatPrecision={2}
        smStep={0.5}
        mdStep={1}
        lgStep={2.5}
        max={20}
        min={0}
        outlined
        value={u32}
        onChange={setU32}
      />
    </div>
  );
}
