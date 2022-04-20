import { Input } from "./Input";

export const title = "Input";

export default function InputStories() {
  return (
    <div style={{ backgroundColor: "white", padding: "8px", maxWidth: "380px" }}>
      <Input placeholder="ex: John Doe" />
      <Input placeholder="ex: John Doe" state="success" />
      <Input placeholder="ex: John Doe" state="error" />
      <Input placeholder="ex: John Doe" disabled />
      <Input placeholder="ex: John Doe" state="success" disabled />
      <Input placeholder="ex: John Doe" state="error" disabled />
    </div>
  );
}
