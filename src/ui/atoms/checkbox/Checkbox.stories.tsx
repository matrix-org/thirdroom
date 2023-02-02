import { Checkbox } from "./Checkbox";

export const title = "Checkbox";

export default function CheckboxStories() {
  return (
    <div className="flex">
      <Checkbox onCheckedChange={(v) => console.log(v)} />
      <Checkbox defaultChecked={true} onCheckedChange={(v) => console.log(v)} />
      <Checkbox defaultChecked={true} disabled />
    </div>
  );
}
