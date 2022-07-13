import { Button } from "../../../atoms/button/Button";
import { EmptyState } from "./EmptyState";

export const title = "EmptyState";

export default function EmptyStateStories() {
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
