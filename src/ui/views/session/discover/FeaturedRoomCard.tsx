import { Platform, Session } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { RoomPreviewCard } from "../../components/room-preview-card/RoomPreviewCard";
import { RoomSummaryProvider } from "../../components/RoomSummaryProvider";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Dots } from "../../../atoms/loading/Dots";
import { JoinRoomProvider } from "../../components/JoinRoomProvider";
import { activeChatsAtom } from "../../../state/overlayChat";
import { SidebarTab, sidebarTabAtom } from "../../../state/sidebarTab";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";

export function FeaturedRoomCard({
  session,
  platform,
  roomId,
}: {
  session: Session;
  platform: Platform;
  roomId: string;
}) {
  const selectChat = useSetAtom(activeChatsAtom);
  const setSidebarTab = useSetAtom(sidebarTabAtom);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);

  const handleViewRoom = () => {
    selectChat({ type: "OPEN", roomId });
    setSidebarTab(SidebarTab.Home);
    setOverlayWindow({ type: OverlayWindow.None });
  };

  return (
    <RoomSummaryProvider roomIdOrAlias={roomId} fallback={() => <RoomPreviewCard />}>
      {(summaryData) => (
        <RoomPreviewCard
          avatar={
            <Avatar
              imageSrc={
                summaryData.avatarUrl && getAvatarHttpUrl(summaryData.avatarUrl, 60, platform, session.mediaRepository)
              }
              shape="rounded"
              size="lg"
              bgColor={`var(--usercolor${getIdentifierColorNumber(summaryData.roomId)})`}
              name={summaryData.name}
            />
          }
          name={summaryData.name}
          desc={summaryData.topic}
          memberCount={summaryData.memberCount}
          options={
            <div className="flex items-center gap-xs">
              <JoinRoomProvider session={session} roomId={roomId}>
                {(join, isJoined, loading, error) =>
                  isJoined ? (
                    <Button variant="secondary" fill="outline" size="sm" onClick={handleViewRoom}>
                      View
                    </Button>
                  ) : (
                    <Button
                      disabled={loading}
                      variant="secondary"
                      size="sm"
                      onClick={() => join(summaryData.alias ?? roomId)}
                    >
                      {loading && <Dots size="sm" color="on-secondary" />}
                      {loading ? "Joining" : "Join"}
                    </Button>
                  )
                }
              </JoinRoomProvider>
            </div>
          }
        />
      )}
    </RoomSummaryProvider>
  );
}
