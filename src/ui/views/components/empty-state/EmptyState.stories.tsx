import { Meta } from "@storybook/react";

import { Button } from "../../../atoms/button/Button";
import { EmptyState } from "./EmptyState";

export default {
  title: "EmptyState",
  component: EmptyState,
} as Meta<typeof EmptyState>;

export function EmptyStateStories() {
  return (
    <div>
      <EmptyState
        heading="No Messages"
        text="It seems, No messages in you inbox. It seems, No messages in you inbox. It seems, No messages in you inbox. It seems, No messages in you inbox. It seems, No messages in you inbox."
        actions={
          <>
            <Button fill="outline" onClick={() => false}>
              Cancel
            </Button>
            <Button>Start Chatting</Button>
          </>
        }
      />
    </div>
  );
}
