import { Session, Room, TimelineEvent, makeTxnId } from "@thirdroom/hydrogen-view-sdk";
import { useCallback, useEffect, useRef, useState } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { Dots } from "../../../atoms/loading/Dots";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import { Text } from "../../../atoms/text/Text";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { getHttpUrl } from "../../../utils/avatar";
import { DiscoverGroup, DiscoverGroupGrid } from "../../components/discover-group/DiscoverGroup";
import { ScenePreviewCard, ScenePreviewCardContent } from "../../components/scene-preview-card/ScenePreviewCard";
import MoreHorizontalIC from ".././../.././../../res/ic/more-horizontal.svg";
import AddIC from ".././../.././../../res/ic/add.svg";
import "./DiscoverCreator.css";
import { Icon } from "../../../atoms/icon/Icon";
import { SceneData, sceneDataToScene, SceneSubmission } from "./SceneSubmission";
import { RepositoryEvents } from "./DiscoverView";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { Button } from "../../../atoms/button/Button";
import { useFeaturedScenes } from "../../components/FeaturedScenesProvider";
import { ThumbnailBadgeWrapper } from "../../../atoms/thumbnail/ThumbnailBadgeWrapper";
import { NotificationBadge } from "../../../atoms/badge/NotificationBadge";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { eventByOrderKey } from "../../../utils/matrixUtils";
import { useOrderString } from "../../../hooks/useOrderString";

const getScenes = async (
  session: Session,
  roomId: string,
  options?: {
    from?: string;
    limit?: number;
    sender?: string[];
    dir?: "b" | "f";
  }
) => {
  return session.hsApi
    .messages(roomId, {
      dir: options?.dir ?? "b",
      from: options?.from,
      limit: options?.limit ?? 20,
      filter: {
        types: [RepositoryEvents.Scene],
        senders: options?.sender,
      },
    })
    .response();
};

function useScenes(room: Room, sender?: string) {
  const { session } = useHydrogen(true);
  const [scenes, setScenes] = useState<TimelineEvent[]>([]);
  const endPointsRef = useRef<{ start?: string; end?: string }>({});
  const isMounted = useIsMounted();
  const [loading, setLoading] = useState(false);

  const loadScenes = useCallback(
    async (reset: boolean, backward: boolean) => {
      setLoading(true);
      if (reset) endPointsRef.current = {};
      const data = await getScenes(session, room.id, {
        sender: sender ? [sender] : undefined,
        from: backward ? endPointsRef.current.end : endPointsRef.current.start,
        dir: backward ? "b" : "f",
        limit: 10,
      });

      if (!isMounted() || !Array.isArray(data.chunk)) return;

      if (reset) {
        endPointsRef.current = { start: data.start, end: data.end };
        setScenes(data.chunk);
      } else {
        if (backward) endPointsRef.current.end = data.end;
        else endPointsRef.current.start = data.end;
        setScenes((state) => (backward ? [...state, ...data.chunk] : [...data.chunk, ...state]));
      }
      setLoading(false);
    },
    [session, room, sender, isMounted]
  );

  useEffect(() => {
    endPointsRef.current = {};
    loadScenes(true, true);
  }, [loadScenes]);

  const deleteScene = (sceneEvent: TimelineEvent) => {
    setScenes((state) => state.filter((event) => event.event_id !== sceneEvent.event_id));
    session.hsApi.redact(room.id, sceneEvent.event_id, makeTxnId(), {});
  };

  const canLoadBack = typeof endPointsRef.current.end === "string";
  return { scenes, loading, loadScenes, canLoadBack, deleteScene };
}

interface DiscoverCreatorProps {
  room: Room;
  permissions: {
    canFeatureScenes: boolean;
    canRedact: boolean;
  };
}
export function DiscoverCreator({ room, permissions }: DiscoverCreatorProps) {
  const { session } = useHydrogen(true);

  const [showAll, setShowAll] = useState(false);
  const order = useOrderString();
  const featuredScenes = useFeaturedScenes(room);
  const isFeatured = (eventId: string) => featuredScenes.find((stateEvent) => stateEvent.state_key === eventId);
  const { scenes, loading, loadScenes, canLoadBack, deleteScene } = useScenes(
    room,
    showAll ? undefined : session.userId
  );

  const isValidScene = (sceneEvent: TimelineEvent) => {
    const scene = sceneEvent?.content?.scene;
    if (typeof scene !== "object") return false;
    if (scene.url && scene.preview_url && scene.name && scene.author_name) {
      return true;
    }
    return false;
  };

  const featureScene = (sceneEvent: TimelineEvent) => {
    if (!isValidScene(sceneEvent)) return;

    featuredScenes.sort(eventByOrderKey);

    let prevOrder;

    if (featuredScenes.length > 0) {
      const firstEvent = featuredScenes[0];
      const firstOrder = firstEvent.content.order;
      prevOrder = order.getPrevStr(firstOrder);
    }

    session.hsApi.sendState(room.id, RepositoryEvents.FeaturedScene, sceneEvent.event_id, {
      scene: sceneEvent.content.scene,
      order: prevOrder ?? undefined,
    });
  };

  const unFeatureScene = (sceneEvent: TimelineEvent) => {
    session.hsApi.sendState(room.id, RepositoryEvents.FeaturedScene, sceneEvent.event_id, {});
  };

  const previewScene = (sceneEvent: TimelineEvent) => {
    if (!isValidScene(sceneEvent)) return;
    window.open(`/scene-preview?url=${sceneEvent.content.scene.url}`, "__blank");
  };

  const uploadScene = async (data: SceneData) => {
    const scene = sceneDataToScene(data);
    await session.hsApi.send(room.id, RepositoryEvents.Scene, makeTxnId(), { scene }).response();
  };

  return (
    <Scroll>
      <Content className="DiscoverCreator__content">
        <DiscoverGroup
          label={
            <div className="flex items-center gap-md">
              <Label className="grow">Scenes</Label>
              <div className="flex items-center gap-sm">
                <button
                  disabled={loading}
                  className="DiscoverCreator__textBtn"
                  onClick={async () => loadScenes(false, false)}
                >
                  <Text variant="b3" weight="bold" type="span">
                    Refresh
                  </Text>
                </button>
                {permissions.canFeatureScenes && (
                  <button className="DiscoverCreator__textBtn" onClick={() => setShowAll((state) => !state)}>
                    <Text variant="b3" weight="bold" type="span">
                      {showAll ? "From: Everyone" : "From: Me"}
                    </Text>
                  </button>
                )}
              </div>
            </div>
          }
          content={
            <div className="flex flex-column gap-md">
              <DiscoverGroupGrid itemMinWidth={400} gap="md">
                <a
                  target="_blank"
                  href="https://github.com/matrix-org/thirdroom-unity-exporter/blob/main/Documentation~/index.md"
                  className="DiscoverCreator__unityButton flex flex-column items-center justify-center"
                >
                  <Text color="primary" type="span" variant="b1" weight="semi-bold">
                    Third Room Unity Exporter
                  </Text>
                  <Text color="primary" type="span" variant="b3">
                    Read docs to create and export your own custom scenes
                  </Text>
                </a>
                <SceneSubmission
                  onSave={async (data) => {
                    await uploadScene(data);
                    loadScenes(false, false);
                  }}
                  renderTrigger={(openModal) => (
                    <button
                      onClick={openModal}
                      className="DiscoverCreator__sceneButton flex flex-column items-center justify-center"
                    >
                      <Icon size="xl" src={AddIC} />
                      <Text type="span" variant="b3" weight="semi-bold">
                        Upload Scene
                      </Text>
                    </button>
                  )}
                />
                {scenes.map(
                  (sceneEvent) =>
                    isValidScene(sceneEvent) && (
                      <ScenePreviewCard
                        key={sceneEvent.event_id}
                        thumbnail={
                          <ThumbnailBadgeWrapper
                            badge={isFeatured(sceneEvent.event_id) && <NotificationBadge content="Featured" />}
                          >
                            <Thumbnail size="lg" wide>
                              <ThumbnailImg
                                src={getHttpUrl(session, sceneEvent.content.scene.preview_url) ?? ""}
                                alt={sceneEvent.content.scene.name}
                              />
                            </Thumbnail>
                          </ThumbnailBadgeWrapper>
                        }
                      >
                        <ScenePreviewCardContent>
                          <div className="grow">
                            <Text className="truncate" variant="b3">
                              {sceneEvent.content.scene.author_name}
                            </Text>
                            <Text className="truncate">{sceneEvent.content.scene.name}</Text>
                          </div>
                          <div className="flex items-center gap-xs">
                            {(permissions.canFeatureScenes ||
                              permissions.canRedact ||
                              session.userId === sceneEvent.sender) && (
                              <DropdownMenu
                                content={
                                  <div style={{ padding: "var(--sp-xxs) 0" }}>
                                    <DropdownMenuItem onSelect={() => previewScene(sceneEvent)}>
                                      Preview
                                    </DropdownMenuItem>
                                    {permissions.canFeatureScenes && (
                                      <>
                                        {isFeatured(sceneEvent.event_id) ? (
                                          <DropdownMenuItem onSelect={() => unFeatureScene(sceneEvent)}>
                                            Un-Feature
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem onSelect={() => featureScene(sceneEvent)}>
                                            Feature
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}
                                    {/* {session.userId === scene.sender && <DropdownMenuItem>Edit</DropdownMenuItem>} */}
                                    {(permissions.canRedact || session.userId === sceneEvent.sender) && (
                                      <DropdownMenuItem
                                        onSelect={() => {
                                          if (window.confirm("Are you sure?")) deleteScene(sceneEvent);
                                        }}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </div>
                                }
                              >
                                <IconButton iconSrc={MoreHorizontalIC} label="Delete Scene" />
                              </DropdownMenu>
                            )}
                          </div>
                        </ScenePreviewCardContent>
                      </ScenePreviewCard>
                    )
                )}
              </DiscoverGroupGrid>
              {loading ? (
                <div className="flex justify-center items-center gap-sm">
                  <Dots />
                  <Text>Loading</Text>
                </div>
              ) : (
                canLoadBack && (
                  <div className="flex justify-center items-center">
                    <Button className="DiscoverCreator__loadMore" onClick={() => loadScenes(false, true)}>
                      Load More
                    </Button>
                  </div>
                )
              )}
            </div>
          }
        />
      </Content>
    </Scroll>
  );
}
