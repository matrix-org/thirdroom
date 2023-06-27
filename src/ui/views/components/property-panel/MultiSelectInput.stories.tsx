import { useState } from "react";
import { Meta } from "@storybook/react";

import { MultiSelectInput } from "./MultiSelectInput";

export default {
  title: "MultiSelectInput",
  component: MultiSelectInput,
} as Meta<typeof MultiSelectInput>;

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
export function MultiSelectInputStories() {
  const [selected, setSelected] = useState([options[0]]);

  console.log(selected);

  return (
    <div style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <MultiSelectInput options={options} selected={selected} onSelectedChange={setSelected} />
    </div>
  );
}
