import { Dots } from "./Dots";

export const title = "Dots";

export default function DotsStories() {
  return (
    <div className="flex gap-md">
      <Dots size="sm" />
      <Dots />
      <Dots size="lg" />
      <Dots paused />
    </div>
  );
}
