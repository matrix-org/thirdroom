import { Switch } from "./Switch";

export const title = "Switch";

export default function SwitchStories() {
  return (
    <div className="flex">
      <Switch onCheckedChange={(v) => console.log(v)} />
      <Switch defaultChecked={true} onCheckedChange={(v) => console.log(v)} />
      <Switch defaultChecked={true} disabled />
    </div>
  );
}
