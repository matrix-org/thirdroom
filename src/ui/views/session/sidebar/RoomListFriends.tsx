import { Button } from "../../../atoms/button/Button";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoomsOfType, RoomTypes } from "../../../hooks/useRoomsOfType";
import { useStore } from "../../../hooks/useStore";
import { EmptyState } from "../../components/empty-state/EmptyState";
import { DmDialog } from "../dialogs/DmDialog";
import { RoomSelector } from "./selector/RoomSelector";

export function RoomListFriends() {
  const { session, platform } = useHydrogen(true);

  const [rooms] = useRoomsOfType(session, RoomTypes.Direct);

  const { selectedChatId, selectChat } = useStore((state) => state.overlayChat);

  if (rooms.length === 0) {
    return (
      <EmptyState
        style={{ minHeight: "400px" }}
        heading="No Friends"
        text="You don't have any friend yet."
        actions={<DmDialog renderTrigger={(openDialog) => <Button onClick={openDialog}>Direct Message</Button>} />}
      />
    );
  }

  return (
    <div>
      {rooms.map((room) => (
        <RoomSelector
          key={room.id}
          isSelected={room.id === selectedChatId}
          onSelect={selectChat}
          room={room}
          platform={platform}
        />
      ))}
    </div>
  );
}
