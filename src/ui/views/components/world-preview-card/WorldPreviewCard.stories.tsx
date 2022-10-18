import { WorldPreviewCard } from "./WorldPreviewCard";
import { Button } from "../../../atoms/button/Button";
import { Progress } from "../../../atoms/progress/Progress";
import { Text } from "../../../atoms/text/Text";

export const title = "WorldPreviewCard";

export default function WorldPreviewCardStories() {
  return (
    <div>
      <WorldPreviewCard
        title="Arch linux"
        desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
        memberCount={234}
        options={
          <Button size="lg" variant="primary" onClick={() => console.log("clicked")}>
            Join World
          </Button>
        }
      />
      <WorldPreviewCard
        title="Arch linux"
        desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
      />
      <WorldPreviewCard
        title="Arch linux"
        memberCount={34}
        content={
          <div className="flex flex-column gap-xs">
            <Progress variant="secondary" max={100} value={50} />
            <Text color="surface-low" variant="b3">
              50%
            </Text>
          </div>
        }
      />
      <WorldPreviewCard
        title="Arch linux"
        options={
          <Button size="lg" variant="primary" onClick={() => console.log("clicked")}>
            Join World
          </Button>
        }
      />
    </div>
  );
}
