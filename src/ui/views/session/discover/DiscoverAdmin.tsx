import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Icon } from "../../../atoms/icon/Icon";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import { Text } from "../../../atoms/text/Text";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { RoomTypes, useRoomsOfType } from "../../../hooks/useRoomsOfType";
import { useStateEvents } from "../../../hooks/useStateEvents";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import ChevronBottomIC from ".././../.././../../res/ic/chevron-bottom.svg";
import "./DiscoverAdmin.css";
import { RepositoryEvents } from "./DiscoverView";

function FeatureRoom({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);
  const featuredRooms = useStateEvents(room, RepositoryEvents.FeaturedRooms);
  const [allRooms] = useRoomsOfType(session, RoomTypes.Room);
  const unFeaturedRoom = allRooms.filter((room) => {
    const stateEvent = featuredRooms.get(room.id);
    if (!stateEvent) return true;
    if (Object.keys(stateEvent.content).length === 0) return true;
    return false;
  });
  const [selectedRoom, setSelectedRoom] = useState<Room>();
  const isMounted = useIsMounted();

  const {
    callback: featureRoom,
    loading,
    error,
  } = useAsyncCallback(
    async (fRoom: Room) => {
      const mEvent = await fRoom.getStateEvent("m.room.join_rules", "");
      const isPublic = mEvent?.event?.content?.join_rule === "public" ?? false;
      if (!isPublic) throw new Error("Room is not public.");
      await session.hsApi.sendState(room.id, RepositoryEvents.FeaturedRooms, fRoom.id, {
        suggested: false,
        auto_join: false,
        via: [],
      });
      if (isMounted()) {
        setSelectedRoom(undefined);
      }
    },
    [session]
  );

  return (
    <SettingTile label={<Label>Feature Public Room</Label>}>
      <div className="flex flex-column gap-xxs">
        <div className="flex gap-sm">
          <DropdownMenu
            content={
              <Scroll style={{ maxHeight: "200px", padding: "var(--sp-xs) 0" }}>
                {unFeaturedRoom.length === 0 ? (
                  <div style={{ padding: "0 var(--sp-md)" }}>
                    <Text variant="b2" weight="medium">
                      No Rooms
                    </Text>
                  </div>
                ) : (
                  unFeaturedRoom.map((room) => (
                    <DropdownMenuItem
                      className="flex items-center gap-xs"
                      key={room.id}
                      onSelect={() => setSelectedRoom(room)}
                    >
                      <Avatar
                        imageSrc={
                          room.avatarUrl && getAvatarHttpUrl(room.avatarUrl, 60, platform, session.mediaRepository)
                        }
                        shape="rounded"
                        size="xxs"
                        bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
                        name={room.name ?? "Unknown room"}
                      />
                      <Text variant="b2" weight="medium">
                        {room.name}
                      </Text>
                    </DropdownMenuItem>
                  ))
                )}
              </Scroll>
            }
          >
            <Button fill="outline">
              {selectedRoom ? (
                <Avatar
                  imageSrc={
                    selectedRoom.avatarUrl &&
                    getAvatarHttpUrl(selectedRoom.avatarUrl, 60, platform, session.mediaRepository)
                  }
                  shape="rounded"
                  size="xxs"
                  bgColor={`var(--usercolor${getIdentifierColorNumber(selectedRoom.id)})`}
                  name={selectedRoom.name ?? "Unknown room"}
                />
              ) : null}
              {selectedRoom ? selectedRoom.name ?? "Unknown room" : "Select Room"}
              <Icon color="primary" src={ChevronBottomIC} />
            </Button>
          </DropdownMenu>
          <Button
            disabled={!selectedRoom || loading}
            onClick={() => {
              if (selectedRoom) featureRoom(selectedRoom);
            }}
          >
            Feature
          </Button>
        </div>
        {error && (
          <Text color="danger" variant="b3">
            {error.message}
          </Text>
        )}
      </div>
    </SettingTile>
  );
}

function FeatureWorld({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);
  const featuredWorlds = useStateEvents(room, RepositoryEvents.FeaturedWorlds);
  const [allWorlds] = useRoomsOfType(session, RoomTypes.World);
  const unFeaturedWorlds = allWorlds.filter((room) => {
    const stateEvent = featuredWorlds.get(room.id);
    if (!stateEvent) return true;
    if (Object.keys(stateEvent.content).length === 0) return true;
    return false;
  });
  const [selectedWorld, setSelectedWorld] = useState<Room>();
  const isMounted = useIsMounted();

  const {
    callback: featureWorld,
    loading,
    error,
  } = useAsyncCallback(
    async (fWorld: Room) => {
      const mEvent = await fWorld.getStateEvent("m.room.join_rules", "");
      const isPublic = mEvent?.event?.content?.join_rule === "public" ?? false;
      if (!isPublic) throw new Error("World is not public.");
      await session.hsApi.sendState(room.id, RepositoryEvents.FeaturedWorlds, fWorld.id, {
        suggested: false,
        auto_join: false,
        via: [],
      });
      if (isMounted()) {
        setSelectedWorld(undefined);
      }
    },
    [session]
  );

  return (
    <SettingTile label={<Label>Feature Public World</Label>}>
      <div className="flex flex-column gap-xxs">
        <div className="flex gap-sm">
          <DropdownMenu
            content={
              <Scroll style={{ maxHeight: "200px", padding: "var(--sp-xs) 0" }}>
                {unFeaturedWorlds.length === 0 ? (
                  <div style={{ padding: "0 var(--sp-md)" }}>
                    <Text variant="b2" weight="medium">
                      No Worlds
                    </Text>
                  </div>
                ) : (
                  unFeaturedWorlds.map((room) => (
                    <DropdownMenuItem
                      className="flex items-center gap-xs"
                      key={room.id}
                      onSelect={() => setSelectedWorld(room)}
                    >
                      <Avatar
                        imageSrc={
                          room.avatarUrl && getAvatarHttpUrl(room.avatarUrl, 60, platform, session.mediaRepository)
                        }
                        shape="rounded"
                        size="xxs"
                        bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
                        name={room.name ?? "Unknown world"}
                      />
                      <Text variant="b2" weight="medium">
                        {room.name}
                      </Text>
                    </DropdownMenuItem>
                  ))
                )}
              </Scroll>
            }
          >
            <Button fill="outline">
              {selectedWorld ? (
                <Avatar
                  imageSrc={
                    selectedWorld.avatarUrl &&
                    getAvatarHttpUrl(selectedWorld.avatarUrl, 60, platform, session.mediaRepository)
                  }
                  shape="circle"
                  size="xxs"
                  bgColor={`var(--usercolor${getIdentifierColorNumber(selectedWorld.id)})`}
                  name={selectedWorld.name ?? "Unknown world"}
                />
              ) : null}
              {selectedWorld ? selectedWorld.name ?? "Unknown world" : "Select World"}
              <Icon color="primary" src={ChevronBottomIC} />
            </Button>
          </DropdownMenu>
          <Button
            disabled={!selectedWorld || loading}
            onClick={() => {
              if (selectedWorld) featureWorld(selectedWorld);
            }}
          >
            Feature
          </Button>
        </div>
        {error && (
          <Text color="danger" variant="b3">
            {error.message}
          </Text>
        )}
      </div>
    </SettingTile>
  );
}

export function DiscoverAdmin({ room }: { room: Room }) {
  return (
    <Scroll>
      <Content className="DiscoverAdmin__content">
        <div className="flex flex-column gap-md">
          <FeatureRoom room={room} />
          <FeatureWorld room={room} />
        </div>
      </Content>
    </Scroll>
  );
}
