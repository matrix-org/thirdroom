import { useState } from "react";

import { NumericInput } from "./NumericInput";
import { Text } from "../text/Text";

export const title = "NumericInput";

export default function NumericInputStories() {
  const [number, setNumber] = useState(10);

  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <NumericInput
        before={
          <Text variant="b3" color="surface-low">
            X
          </Text>
        }
        inputSize="sm"
        smStep={0.5}
        mdStep={1}
        lgStep={2}
        outlined
        value={number}
        onChange={setNumber}
      />
    </div>
  );
}
