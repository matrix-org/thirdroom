import { Button } from "../../../../atoms/button/Button";
import { Dialog } from "../../../../atoms/dialog/Dialog";
import { Text } from "../../../../atoms/text/Text";

interface WebSceneGraphDialogProps {
  open: boolean;
  requestClose: () => void;
}

export function WebSceneGraphDialog({ open, requestClose }: WebSceneGraphDialogProps) {
  return (
    <Dialog open={open}>
      <div className="flex flex-column gap-lg" style={{ padding: "var(--sp-xl) var(--sp-md) var(--sp-lg)" }}>
        <div className="flex flex-column item-center gap-md text-center">
          <Text variant="h2" weight="bold">
            Web Scene Graph
          </Text>
          <Text variant="b3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras et facilisis ex. Sed eget pellentesque mi.
            Pellentesque ultrices molestie ligula, eu finibus risus rhoncus vel. Praesent ac malesuada neque. Sed
            malesuada tempor ultrices. In blandit metus quis tincidunt vehicula.
          </Text>
        </div>
        <div style={{ maxWidth: 225, margin: "auto" }} className="flex flex-column items-center gap-sm text-center">
          <Text weight="bold">Open the tutorial in a new tab to get started.</Text>
          <Button style={{ minWidth: 175 }}>Open Tutorial</Button>
          <Text variant="b3">Instruction for the next step are on the next page 👀</Text>
        </div>
      </div>
    </Dialog>
  );
}
