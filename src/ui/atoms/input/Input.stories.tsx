import { Input } from "./Input";
import { Icon } from "../icon/Icon";
import { Text } from "../text/Text";
import SearchIC from "../../../../res/ic/search.svg";

export const title = "Input";

export default function InputStories() {
  return (
    <div className="flex flex-column gap-xs" style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <Input placeholder="ex: John Doe" inputSize="lg" />
      <Input placeholder="ex: John Doe" />
      <Input placeholder="Search" before={<Icon color="surface" src={SearchIC} />} />
      <Input placeholder="Search" after={<Icon color="surface" src={SearchIC} />} />
      <Input placeholder="john" before={<Text variant="b2">@</Text>} after={<Text variant="b2">:matrix.org</Text>} />
      <Input placeholder="ex: John Doe" inputSize="sm" />
      <Input placeholder="ex: John Doe" inputSize="sm" outlined />
      <Input placeholder="ex: John Doe" state="success" />
      <Input placeholder="ex: John Doe" state="error" />
      <Input placeholder="ex: John Doe" disabled />
      <Input placeholder="ex: John Doe" state="success" disabled />
      <Input placeholder="ex: John Doe" state="error" disabled />
    </div>
  );
}
