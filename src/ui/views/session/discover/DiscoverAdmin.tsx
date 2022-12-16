import { Room, makeTxnId } from "@thirdroom/hydrogen-view-sdk";
import { FormEvent, ReactNode, useRef } from "react";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import { Text } from "../../../atoms/text/Text";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { RoomTypes, useRoomsOfType } from "../../../hooks/useRoomsOfType";
import { useStateEvents } from "../../../hooks/useStateEvents";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { FeaturedRoomsProvider } from "../../components/FeaturedRoomsProvider";
import { RoomSummaryProvider } from "../../components/RoomSummaryProvider";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import ChevronBottomIC from ".././../.././../../res/ic/chevron-bottom.svg";
import BinIC from ".././../.././../../res/ic/bin.svg";
import "./DiscoverAdmin.css";
import { RepositoryEvents } from "./DiscoverView";
import { SceneData, sceneDataToScene, SceneSubmission } from "./SceneSubmission";
import { FeaturedWorldsProvider } from "../../components/FeaturedWorldsProvider";
import { FeaturedScenesProvider } from "../../components/FeaturedScenesProvider";
import { Input } from "../../../atoms/input/Input";
import { isValidRoomId } from "../../../utils/matrixUtils";
import { getRoomSummary } from "../../../hooks/useRoomSummary";

interface FeaturedItemProps {
  before?: ReactNode;
  children?: ReactNode;
  after?: ReactNode;
}
function FeaturedItem({ before, children, after }: FeaturedItemProps) {
  return (
    <div className="FeaturedItem flex items-center gap-md">
      {before && <div>{before}</div>}
      <div className="grow">{children}</div>
      {after && <div>{after}</div>}
    </div>
  );
}

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
  const formRef = useRef<HTMLFormElement>(null);

  const {
    callback: featureRoom,
    loading,
    error,
  } = useAsyncCallback(
    async (roomId: string) => {
      if (!isValidRoomId(roomId)) throw Error("Invalid roomId");
      const response = await getRoomSummary(session, roomId);
      const summaryData = await response.json();
      if (!summaryData.room_id) throw Error("Can not feature room. Either room is private or does not exist.");
      await session.hsApi.sendState(room.id, RepositoryEvents.FeaturedRooms, roomId, {
        suggested: false,
        via: [],
      });
    },
    [session]
  );

  const removeFeatured = (roomId: string) => {
    if (window.confirm("Are you sure?")) {
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedRooms, roomId, {});
    }
  };

  const handleSelect = (room: Room) => {
    const form = formRef.current;
    if (form) {
      form.roomIdInput.value = room.id;
    }
  };

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const { roomIdInput } = evt.target as typeof evt.target & {
      roomIdInput: HTMLInputElement;
    };
    const roomId = roomIdInput.value.trim();
    if (roomId) featureRoom(roomId);
  };

  return (
    <div className="flex flex-column gap-sm">
      <SettingTile label={<Label>Feature Public Room</Label>}>
        <div className="flex flex-column gap-xxs">
          <form ref={formRef} onSubmit={handleSubmit} className="flex gap-sm">
            <Input
              required
              name="roomIdInput"
              placeholder="Room Id"
              after={
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
                            onSelect={() => handleSelect(room)}
                          >
                            <Avatar
                              imageSrc={
                                room.avatarUrl &&
                                getAvatarHttpUrl(room.avatarUrl, 60, platform, session.mediaRepository)
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
                  <IconButton iconSrc={ChevronBottomIC} label="View all" />
                </DropdownMenu>
              }
            />
            <Button type="submit" disabled={loading}>
              Feature
            </Button>
          </form>
          {error && (
            <Text color="danger" variant="b3">
              {error.message}
            </Text>
          )}
        </div>
      </SettingTile>
      <FeaturedRoomsProvider room={room}>
        {(featuredRooms) =>
          featuredRooms.length === 0 ? null : (
            <div>
              {featuredRooms.map(([stateKey, stateEvent]) => (
                <RoomSummaryProvider roomIdOrAlias={stateKey} fallback={() => <FeaturedItem />}>
                  {(summaryData) => (
                    <FeaturedItem
                      before={
                        <Avatar
                          imageSrc={
                            summaryData.avatarUrl &&
                            getAvatarHttpUrl(summaryData.avatarUrl, 60, platform, session.mediaRepository)
                          }
                          shape="rounded"
                          size="lg"
                          bgColor={`var(--usercolor${getIdentifierColorNumber(summaryData.roomId)})`}
                          name={summaryData.name}
                        />
                      }
                      after={
                        <IconButton
                          size="sm"
                          label="Remove Featured"
                          iconSrc={BinIC}
                          onClick={() => removeFeatured(stateKey)}
                        />
                      }
                    >
                      <Text className="truncate">{summaryData.name}</Text>
                      <Text variant="b3" className="truncate">
                        {summaryData.topic}
                      </Text>
                    </FeaturedItem>
                  )}
                </RoomSummaryProvider>
              ))}
            </div>
          )
        }
      </FeaturedRoomsProvider>
    </div>
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
  const formRef = useRef<HTMLFormElement>(null);

  const {
    callback: featureWorld,
    loading,
    error,
  } = useAsyncCallback(
    async (roomId: string) => {
      if (!isValidRoomId(roomId)) throw Error("Invalid roomId");
      const response = await getRoomSummary(session, roomId);
      const summaryData = await response.json();
      if (!summaryData.room_id) throw Error("Can not feature world. Either world is private or does not exist.");
      await session.hsApi.sendState(room.id, RepositoryEvents.FeaturedWorlds, roomId, {
        suggested: false,
        via: [],
      });
    },
    [session]
  );

  const removeFeatured = (roomId: string) => {
    if (window.confirm("Are you sure?")) {
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedWorlds, roomId, {});
    }
  };

  const handleSelect = (room: Room) => {
    const form = formRef.current;
    if (form) {
      form.roomIdInput.value = room.id;
    }
  };

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const { roomIdInput } = evt.target as typeof evt.target & {
      roomIdInput: HTMLInputElement;
    };
    const roomId = roomIdInput.value.trim();
    if (roomId) featureWorld(roomId);
  };

  return (
    <div className="flex flex-column gap-sm">
      <SettingTile label={<Label>Feature Public World</Label>}>
        <div className="flex flex-column gap-xxs">
          <form ref={formRef} onSubmit={handleSubmit} className="flex gap-sm">
            <Input
              required
              name="roomIdInput"
              placeholder="Room Id"
              after={
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
                            onSelect={() => handleSelect(room)}
                          >
                            <Avatar
                              imageSrc={
                                room.avatarUrl &&
                                getAvatarHttpUrl(room.avatarUrl, 60, platform, session.mediaRepository)
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
                  <IconButton iconSrc={ChevronBottomIC} label="View all" />
                </DropdownMenu>
              }
            />
            <Button type="submit" disabled={loading}>
              Feature
            </Button>
          </form>
          {error && (
            <Text color="danger" variant="b3">
              {error.message}
            </Text>
          )}
        </div>
      </SettingTile>
      <FeaturedWorldsProvider room={room}>
        {(featuredWorlds) =>
          featuredWorlds.length === 0 ? null : (
            <div>
              {featuredWorlds.map(([stateKey, stateEvent]) => (
                <RoomSummaryProvider roomIdOrAlias={stateKey} fallback={() => <FeaturedItem />}>
                  {(summaryData) => (
                    <FeaturedItem
                      before={
                        <Avatar
                          imageSrc={
                            summaryData.avatarUrl &&
                            getAvatarHttpUrl(summaryData.avatarUrl, 60, platform, session.mediaRepository)
                          }
                          shape="circle"
                          size="lg"
                          bgColor={`var(--usercolor${getIdentifierColorNumber(summaryData.roomId)})`}
                          name={summaryData.name}
                        />
                      }
                      after={
                        <IconButton
                          size="sm"
                          label="Remove Featured"
                          iconSrc={BinIC}
                          onClick={() => removeFeatured(stateKey)}
                        />
                      }
                    >
                      <Text className="truncate">{summaryData.name}</Text>
                      <Text variant="b3" className="truncate">
                        {summaryData.topic}
                      </Text>
                    </FeaturedItem>
                  )}
                </RoomSummaryProvider>
              ))}
            </div>
          )
        }
      </FeaturedWorldsProvider>
    </div>
  );
}

function FeatureScene({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);

  const handleSave = async (data: SceneData) => {
    const scene = sceneDataToScene(data);

    try {
      const result = await session.hsApi
        .send(room.id, RepositoryEvents.Scene, makeTxnId(), {
          scene,
        })
        .response();

      const eventId = result.event_id;
      if (!eventId) return;

      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedScenes, eventId, {
        scene,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const removeFeatured = (roomId: string) => {
    if (window.confirm("Are you sure?")) {
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedScenes, roomId, {});
    }
  };

  return (
    <div className="flex flex-column gap-sm">
      <SceneSubmission
        onSave={handleSave}
        renderTrigger={(openModal) => (
          <SettingTile label={<Label>Feature Scene</Label>}>
            <Button onClick={openModal}>Submit Scene</Button>
          </SettingTile>
        )}
      />
      <FeaturedScenesProvider room={room}>
        {(featuredScenes) =>
          featuredScenes.length === 0 ? null : (
            <div>
              {featuredScenes.map(([stateKey, stateEvent]) => (
                <FeaturedItem
                  before={
                    <Avatar
                      imageSrc={
                        stateEvent.content.scene.preview_url &&
                        getAvatarHttpUrl(stateEvent.content.scene.preview_url, 60, platform, session.mediaRepository)
                      }
                      shape="circle"
                      size="lg"
                      bgColor={`var(--usercolor${getIdentifierColorNumber(stateKey)})`}
                      name={stateEvent.content.scene.name}
                    />
                  }
                  after={
                    <IconButton
                      size="sm"
                      label="Remove Featured"
                      iconSrc={BinIC}
                      onClick={() => removeFeatured(stateKey)}
                    />
                  }
                >
                  <Text className="truncate">{stateEvent.content.scene.name}</Text>
                  <Text variant="b3" className="truncate">
                    {stateEvent.content.scene.descripton}
                  </Text>
                </FeaturedItem>
              ))}
            </div>
          )
        }
      </FeaturedScenesProvider>
    </div>
  );
}

interface DiscoverAdminProps {
  room: Room;
  permissions: {
    canFeatureRooms: boolean;
    canFeatureWorlds: boolean;
    canFeatureScenes: boolean;
  };
}

export function DiscoverAdmin({ room, permissions }: DiscoverAdminProps) {
  return (
    <Scroll>
      <Content className="DiscoverAdmin__content">
        <div className="flex flex-column gap-lg">
          {permissions.canFeatureRooms && <FeatureRoom room={room} />}
          {permissions.canFeatureWorlds && <FeatureWorld room={room} />}
          {permissions.canFeatureScenes && <FeatureScene room={room} />}
        </div>
      </Content>
    </Scroll>
  );
}
