import { useState } from "react";
import { GroupCall } from "@thirdroom/hydrogen-view-sdk";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { useRoomsOfType, RoomTypes } from "../../../hooks/useRoomsOfType";
import { useStore } from "../../../hooks/useStore";
import { WorldSelector } from "./selector/WorldSelector";
import { RoomSelector } from "./selector/RoomSelector";
import { Icon } from "../../../atoms/icon/Icon";
import ChevronRightIC from "../../../../../res/ic/chevron-right.svg";
import ChevronBottomIC from "../../../../../res/ic/chevron-bottom.svg";
import { EmptyState } from "../../components/empty-state/EmptyState";
import { OverlayWindow } from "../../../hooks/useStore";
import { Button } from "../../../atoms/button/Button";

interface RoomListHomeProps {
  groupCalls: Map<string, GroupCall>;
}

export function RoomListHome({ groupCalls }: RoomListHomeProps) {
  const { session, platform } = useHydrogen(true);
  const { selectWindow } = useStore((state) => state.overlayWindow);

  const [worlds] = useRoomsOfType(session, RoomTypes.World);
  const [rooms] = useRoomsOfType(session, RoomTypes.Room);

  const [worldCat, setWorldCat] = useState(true);
  const [roomCat, setRoomCat] = useState(true);

  const { selectedChatId, selectChat } = useStore((state) => state.overlayChat);
  const { selectedWorldId, selectWorld } = useStore((state) => state.overlayWorld);

  if (worlds.length === 0 && rooms.length === 0) {
    return (
      <EmptyState
        style={{ minHeight: "400px" }}
        heading="No Worlds"
        text="You haven’t joined any worlds yet."
        actions={<Button onClick={() => selectWindow(OverlayWindow.CreateWorld)}>Create World</Button>}
      />
    );
  }

  return (
    <>
      {worlds.length > 0 && (
        <Category
          header={
            <CategoryHeader
              title="Worlds"
              after={<Icon src={worldCat ? ChevronBottomIC : ChevronRightIC} size="sm" color="surface" />}
              onClick={() => setWorldCat(!worldCat)}
            />
          }
        >
          {worldCat &&
            worlds.map((room) => {
              const groupCall = groupCalls.get(room.id);
              return (
                <WorldSelector
                  key={room.id}
                  isSelected={selectedWorldId === room.id}
                  onSelect={selectWorld}
                  room={room}
                  groupCall={groupCall}
                  session={session}
                  platform={platform}
                />
              );
            })}
        </Category>
      )}
      {rooms.length > 0 && (
        <Category
          header={
            <CategoryHeader
              title="Rooms"
              after={<Icon src={roomCat ? ChevronBottomIC : ChevronRightIC} size="sm" color="surface" />}
              onClick={() => setRoomCat(!roomCat)}
            />
          }
        >
          {roomCat &&
            rooms.map((room) => (
              <RoomSelector
                key={room.id}
                isSelected={room.id === selectedChatId}
                onSelect={selectChat}
                room={room}
                platform={platform}
              />
            ))}
        </Category>
      )}
    </>
  );
}
