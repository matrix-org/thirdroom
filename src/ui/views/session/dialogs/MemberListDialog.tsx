import { useState, ReactNode } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Dialog } from "../../../atoms/dialog/Dialog";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { IconButton } from "../../../atoms/button/IconButton";
import CrossIC from ".././../../../../res/ic/cross.svg";
import { MemberTile } from "../../components/member-tile/MemberTile";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { Text } from "../../../atoms/text/Text";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { useRoomMembers } from "../../../hooks/useRoomMembers";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";

interface MemberListDialogProps {
  room: Room;
  renderTrigger: (openDialog: () => void) => ReactNode;
}

export function MemberListDialog({ room, renderTrigger }: MemberListDialogProps) {
  const { session, platform } = useHydrogen(true);

  const [isOpen, setIsOpen] = useState(false);
  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  const members = useRoomMembers(room);

  return (
    <>
      {renderTrigger(openDialog)}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Header
          left={<HeaderTitle size="lg">Members</HeaderTitle>}
          right={<IconButton iconSrc={CrossIC} onClick={closeDialog} label="Close" />}
        />
        <div className="flex" style={{ height: "600px" }}>
          <Scroll type="hover" style={{ paddingBottom: "var(--sp-lg)" }}>
            <div>
              {Array.from(members).map(([id, member]) =>
                member.membership !== "join" ? null : (
                  <MemberTile
                    key={id}
                    avatar={
                      <Avatar
                        shape="circle"
                        name={member.name}
                        imageSrc={
                          member.avatarUrl && getAvatarHttpUrl(member.avatarUrl, 40, platform, session.mediaRepository)
                        }
                        bgColor={`var(--usercolor${getIdentifierColorNumber(id)})`}
                      />
                    }
                    content={
                      <>
                        <Text className="truncate" weight="medium">
                          {member.name}
                        </Text>
                        <Text className="truncate" color="surface-low" variant="b3">
                          {member.userId}
                        </Text>
                      </>
                    }
                  />
                )
              )}
            </div>
          </Scroll>
        </div>
      </Dialog>
    </>
  );
}
