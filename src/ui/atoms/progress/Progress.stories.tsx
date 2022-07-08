import { Progress } from "./Progress";

export const title = "Progress";

export default function ProgressStories() {
  return (
    <div className="flex flex-column gap-md">
      <Progress value={30} max={100} />
      <Progress variant="secondary" value={10} max={100} />
      <Progress variant="danger" value={80} max={100} />
    </div>
  );
}
