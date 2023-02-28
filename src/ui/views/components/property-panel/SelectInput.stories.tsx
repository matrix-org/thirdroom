import { useState } from "react";

import { SelectInput } from "./SelectInput";

export const title = "SelectInput";

const options = [
  {
    value: 1,
    label: "Option 1",
  },
  {
    value: 2,
    label: "Option 2",
  },
  {
    value: 3,
    label: "Option 3",
  },
  {
    value: 4,
    label: "Option 4",
  },
  {
    value: 5,
    label: "Option 5",
  },
  {
    value: 6,
    label: "Option 6",
  },
];
export default function SelectInputStories() {
  const [selected, setSelected] = useState(options[0].value);

  return (
    <div style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <SelectInput options={options} value={selected} onChange={setSelected} />
    </div>
  );
}
