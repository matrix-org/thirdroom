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
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useFeaturedRooms } from "../../components/FeaturedRoomsProvider";
import { RoomSummaryProvider } from "../../components/RoomSummaryProvider";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import ChevronBottomIC from ".././../.././../../res/ic/chevron-bottom.svg";
import ChevronTopIC from ".././../.././../../res/ic/chevron-top.svg";
import BinIC from ".././../.././../../res/ic/bin.svg";
import "./DiscoverAdmin.css";
import { RepositoryEvents } from "./DiscoverView";
import { SceneData, sceneDataToScene, SceneSubmission } from "./SceneSubmission";
import { useFeaturedWorlds } from "../../components/FeaturedWorldsProvider";
import { useFeaturedScenes } from "../../components/FeaturedScenesProvider";
import { Input } from "../../../atoms/input/Input";
import { eventByOrderKey, isValidRoomId } from "../../../utils/matrixUtils";
import { getRoomSummary } from "../../../hooks/useRoomSummary";
import { useOrderString } from "../../../hooks/useOrderString";
import { useOrderMove } from "../../../hooks/useOrderMove";

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
  const featuredRooms = useFeaturedRooms(room);
  const [allRooms] = useRoomsOfType(session, RoomTypes.Room);
  const unFeaturedRoom = allRooms.filter(
    (room) => !featuredRooms.find((stateEvent) => stateEvent.state_key === room.id)
  );
  const formRef = useRef<HTMLFormElement>(null);
  const orderedRooms = featuredRooms.sort(eventByOrderKey);
  const order = useOrderString();
  const handleMoveUp = useOrderMove(session, room.id, orderedRooms, order);

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
      const firstEvent = orderedRooms[0];
      const firstOrder = firstEvent?.content?.order;
      const prevOrder = order.getPrevStr(typeof firstOrder === "string" ? firstOrder : order.getMidStr());
      await session.hsApi.sendState(room.id, RepositoryEvents.FeaturedRoom, roomId, {
        suggested: false,
        via: [],
        order: prevOrder ?? undefined,
      });
    },
    [session, order]
  );

  const removeFeatured = (roomId: string) => {
    if (window.confirm("Are you sure?")) {
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedRoom, roomId, {});
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
    roomIdInput.value = "";
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
      {orderedRooms.length === 0 ? null : (
        <div>
          {orderedRooms.map((stateEvent, index) => (
            <RoomSummaryProvider
              key={stateEvent.state_key}
              roomIdOrAlias={stateEvent.state_key}
              fallback={() => <FeaturedItem />}
            >
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
                    <div className="flex gap-xs">
                      <IconButton
                        size="sm"
                        label="Remove Featured"
                        iconSrc={BinIC}
                        onClick={() => removeFeatured(stateEvent.state_key)}
                      />
                      <div className="flex flex-column">
                        {index > 0 && (
                          <IconButton
                            size="sm"
                            label="Move Up"
                            iconSrc={ChevronTopIC}
                            onClick={() => handleMoveUp(index)}
                          />
                        )}
                        {index < orderedRooms.length - 1 && (
                          <IconButton
                            size="sm"
                            label="Move Down"
                            iconSrc={ChevronBottomIC}
                            onClick={() => handleMoveUp(index + 1)}
                          />
                        )}
                      </div>
                    </div>
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
      )}
    </div>
  );
}

function FeatureWorld({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);
  const featuredWorlds = useFeaturedWorlds(room);
  const [allWorlds] = useRoomsOfType(session, RoomTypes.World);
  const unFeaturedWorlds = allWorlds.filter(
    (room) => !featuredWorlds.find((stateEvent) => stateEvent.state_key === room.id)
  );
  const formRef = useRef<HTMLFormElement>(null);
  const orderedWorlds = featuredWorlds.sort(eventByOrderKey);
  const order = useOrderString();
  const handleMoveUp = useOrderMove(session, room.id, orderedWorlds, order);

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
      const firstEvent = orderedWorlds[0];
      const firstOrder = firstEvent?.content?.order;
      const prevOrder = order.getPrevStr(typeof firstOrder === "string" ? firstOrder : order.getMidStr());
      await session.hsApi.sendState(room.id, RepositoryEvents.FeaturedWorld, roomId, {
        suggested: false,
        via: [],
        order: prevOrder ?? undefined,
      });
    },
    [session]
  );

  const removeFeatured = (roomId: string) => {
    if (window.confirm("Are you sure?")) {
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedWorld, roomId, {});
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
    roomIdInput.value = "";
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
      {orderedWorlds.length === 0 ? null : (
        <div>
          {orderedWorlds.map((stateEvent, index) => (
            <RoomSummaryProvider
              key={stateEvent.state_key}
              roomIdOrAlias={stateEvent.state_key}
              fallback={() => <FeaturedItem />}
            >
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
                    <div className="flex gap-xs">
                      <IconButton
                        size="sm"
                        label="Remove Featured"
                        iconSrc={BinIC}
                        onClick={() => removeFeatured(stateEvent.state_key)}
                      />

                      <div className="flex flex-column">
                        {index > 0 && (
                          <IconButton
                            size="sm"
                            label="Move Up"
                            iconSrc={ChevronTopIC}
                            onClick={() => handleMoveUp(index)}
                          />
                        )}
                        {index < orderedWorlds.length - 1 && (
                          <IconButton
                            size="sm"
                            label="Move Down"
                            iconSrc={ChevronBottomIC}
                            onClick={() => handleMoveUp(index + 1)}
                          />
                        )}
                      </div>
                    </div>
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
      )}
    </div>
  );
}

function FeatureScene({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);

  const featuredScenes = useFeaturedScenes(room);
  const orderedScenes = featuredScenes.sort(eventByOrderKey);
  const order = useOrderString();
  const handleMoveUp = useOrderMove(session, room.id, orderedScenes, order);

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

      const firstEvent = orderedScenes[0];
      const firstOrder = firstEvent.content.order;
      const prevOrder = order.getPrevStr(firstOrder);
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedScene, eventId, {
        scene,
        order: prevOrder ?? undefined,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const removeFeatured = (roomId: string) => {
    if (window.confirm("Are you sure?")) {
      session.hsApi.sendState(room.id, RepositoryEvents.FeaturedScene, roomId, {});
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

      {orderedScenes.length === 0 ? null : (
        <div>
          {orderedScenes.sort(eventByOrderKey).map((stateEvent, index) => (
            <FeaturedItem
              key={stateEvent.state_key}
              before={
                <Avatar
                  imageSrc={
                    stateEvent.content.scene.preview_url &&
                    getAvatarHttpUrl(stateEvent.content.scene.preview_url, 60, platform, session.mediaRepository)
                  }
                  shape="circle"
                  size="lg"
                  bgColor={`var(--usercolor${getIdentifierColorNumber(stateEvent.state_key)})`}
                  name={stateEvent.content.scene.name}
                />
              }
              after={
                <div className="flex gap-xs">
                  <IconButton
                    size="sm"
                    label="Remove Featured"
                    iconSrc={BinIC}
                    onClick={() => removeFeatured(stateEvent.state_key)}
                  />

                  <div className="flex flex-column">
                    {index > 0 && (
                      <IconButton
                        size="sm"
                        label="Move Up"
                        iconSrc={ChevronTopIC}
                        onClick={() => handleMoveUp(index)}
                      />
                    )}
                    {index < orderedScenes.length - 1 && (
                      <IconButton
                        size="sm"
                        label="Move Down"
                        iconSrc={ChevronBottomIC}
                        onClick={() => handleMoveUp(index + 1)}
                      />
                    )}
                  </div>
                </div>
              }
            >
              <Text className="truncate">{stateEvent.content.scene.name}</Text>
              <Text variant="b3" className="truncate">
                {stateEvent.content.scene.descripton}
              </Text>
            </FeaturedItem>
          ))}
        </div>
      )}
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
