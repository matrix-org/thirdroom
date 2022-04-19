import { Switch } from "../../src/ui/atoms/button/Switch";

export function SwitchStories() {
  return (
    <div className="flex">
      <Switch onCheckedChange={(v) => console.log(v)} />
      <Switch defaultChecked={true} onCheckedChange={(v) => console.log(v)} />
    </div>
  );
}
