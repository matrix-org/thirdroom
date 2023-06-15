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
            Welcome to the Web Scene Graph tutorial! This tutorial will walk you through the basics of the Web Scene
            Graph API and how to use it to build your own 3D experiences.
          </Text>
        </div>
        <div style={{ maxWidth: 225, margin: "auto" }} className="flex flex-column items-center gap-sm text-center">
          <Button style={{ minWidth: 175 }} onClick={requestClose}>
            Open Tutorial
          </Button>
          <Text variant="b3">Instructions for the next step are on the next page 👀</Text>
        </div>
      </div>
    </Dialog>
  );
}
