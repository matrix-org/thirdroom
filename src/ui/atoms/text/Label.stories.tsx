import { Label } from "./Label";

export const title = "Label";

export default function LabelStories() {
  return (
    <div className="flex flex-column">
      <Label>My input label</Label>
      <Label htmlFor="profile-input">My profile</Label>
    </div>
  );
}
