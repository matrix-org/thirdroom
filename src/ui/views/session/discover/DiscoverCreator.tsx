import { Session, Room, TimelineEvent, makeTxnId } from "@thirdroom/hydrogen-view-sdk";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

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
import ChevronBottomIC from ".././../.././../../res/ic/chevron-bottom.svg";
import AddIC from ".././../.././../../res/ic/add.svg";
import "./DiscoverCreator.css";
import { Icon } from "../../../atoms/icon/Icon";
import { SceneData, sceneDataToContent, SceneSubmission } from "./SceneSubmission";
import { RepositoryEvents } from "./DiscoverView";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { Button } from "../../../atoms/button/Button";

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
        types: ["tr.repository_room.scene"],
        sender: options?.sender,
      },
    })
    .response();
};

interface ScenesProviderProps {
  room: Room;
  sender?: string;
  children: (options: {
    scenes: TimelineEvent[];
    loading: boolean;
    loadScenes: (reset: boolean, backward: boolean) => void;
    canLoadBack: boolean;
  }) => ReactNode;
}
function ScenesProvider({ room, sender, children }: ScenesProviderProps) {
  const { session } = useHydrogen(true);
  const [scenes, setScenes] = useState<TimelineEvent[]>([]);
  const endPointsRef = useRef<{ start?: string; end?: string }>({
    start: undefined,
    end: undefined,
  });
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
    endPointsRef.current = {
      start: undefined,
      end: "t52-253359_0_0_0_0_0_0_0_0",
    };
    loadScenes(true, true);
  }, [loadScenes]);

  const canLoadBack = typeof endPointsRef.current.end === "string";
  return <>{children({ scenes, loading, loadScenes, canLoadBack })}</>;
}

interface DiscoverCreatorProps {
  room: Room;
}
export function DiscoverCreator({ room }: DiscoverCreatorProps) {
  const { session } = useHydrogen(true);

  const uploadScene = async (data: SceneData) => {
    const content = sceneDataToContent(data);
    await session.hsApi.send(room.id, RepositoryEvents.Scene, makeTxnId(), content).response();
  };

  return (
    <Scroll>
      <Content className="DiscoverCreator__content">
        <ScenesProvider room={room} sender={session.userId}>
          {({ scenes, loading, loadScenes, canLoadBack }) => (
            <DiscoverGroup
              label={
                <div className="flex items-center gap-md">
                  <Label className="grow">Scenes</Label>
                  <button
                    style={{ cursor: "pointer" }}
                    onClick={async () => {
                      loadScenes(false, false);
                    }}
                  >
                    <Text variant="b3" weight="bold" type="span">
                      Refresh
                    </Text>
                  </button>
                </div>
              }
              content={
                <div className="flex flex-column gap-md">
                  <DiscoverGroupGrid itemMinWidth={400} gap="md">
                    <SceneSubmission
                      onSave={async (data) => {
                        await uploadScene(data);
                        loadScenes(false, false);
                      }}
                      renderTrigger={(openModal) => (
                        <button
                          onClick={openModal}
                          className="DiscoverCreator__button flex flex-column items-center justify-center"
                        >
                          <Icon size="xl" src={AddIC} />
                          <Text type="span" variant="b3" weight="semi-bold">
                            Upload Scene
                          </Text>
                        </button>
                      )}
                    />
                    {scenes.map((scene) => (
                      <ScenePreviewCard
                        key={scene.event_id}
                        thumbnail={
                          <Thumbnail size="lg" wide>
                            <ThumbnailImg
                              src={getHttpUrl(session, scene.content.scene_preview_url) ?? ""}
                              alt={scene.content.scene_name}
                            />
                          </Thumbnail>
                        }
                      >
                        <ScenePreviewCardContent>
                          <div className="grow">
                            <Text className="truncate" variant="b3">
                              {scene.content.scene_author_name}
                            </Text>
                            <Text className="truncate">{scene.content.scene_name}</Text>
                          </div>
                          <div className="flex items-center gap-xs">
                            <IconButton iconSrc={ChevronBottomIC} label="Delete Scene" />
                          </div>
                        </ScenePreviewCardContent>
                      </ScenePreviewCard>
                    ))}
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
          )}
        </ScenesProvider>
      </Content>
    </Scroll>
  );
}
