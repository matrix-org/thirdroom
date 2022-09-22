import { useState, ReactNode, useMemo, useEffect } from "react";
import { Room, RoomMember } from "@thirdroom/hydrogen-view-sdk";

import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { IconButton } from "../../../atoms/button/IconButton";
import CrossIC from ".././../../../../res/ic/cross.svg";
import AddUserIC from ".././../../../../res/ic/add-user.svg";
import { MemberTile } from "../../components/member-tile/MemberTile";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { Text } from "../../../atoms/text/Text";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { useRoomMembers } from "../../../hooks/useRoomMembers";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";
import ChevronBottomIC from "../../../../../res/ic/chevron-bottom.svg";
import ChevronRightIC from "../../../../../res/ic/chevron-right.svg";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { Icon } from "../../../atoms/icon/Icon";
import { usePowerLevels } from "../../../hooks/usePowerLevels";
import { Dots } from "../../../atoms/loading/Dots";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
import { useCalls } from "../../../hooks/useCalls";
import { isPeerMuted, removePeer, toggleMutePeer } from "../../../../engine/network/network.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { InviteDialog } from "./InviteDialog";

interface MemberListDialogProps {
  room: Room;
  requestClose: () => void;
}

export function MemberListDialog({ room, requestClose }: MemberListDialogProps) {
  const { session, platform } = useHydrogen(true);

  const { invited, joined, leaved, banned } = useRoomMembers(room) ?? {};
  const [inviteOpen, setInviteOpen] = useState(false);

  const [, world] = useWorld();

  const isWorld = room.type === "org.matrix.msc3815.world";

  const calls = useCalls(session);
  const activeCall = useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === world?.id ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, world]);

  const [active, setActive] = useState<RoomMember[]>();

  useEffect(() => {
    if (isWorld && activeCall) {
      const me = joined?.find((m) => m.userId === session.userId);
      const activeCallMember = Array.from(new Map(activeCall.members).values());
      setActive((me ? [me] : []).concat(activeCallMember.filter((m) => m.isConnected).map((m) => m.member)));
    }
  }, [isWorld, activeCall, joined, session]);

  const { canDoAction, getPowerLevel } = usePowerLevels(room);
  const myPL = getPowerLevel(session.userId);
  const canInvite = canDoAction("invite", myPL);
  const canKick = canDoAction("kick", myPL);
  const canBan = canDoAction("ban", myPL);

  const [activeCat, setActiveCat] = useState(true);
  const [joinedCat, setJoinedCat] = useState(true);
  const [invitedCat, setInvitedCat] = useState(true);
  const [leaveCat, setLeaveCat] = useState(true);
  const [banCat, setBanCat] = useState(true);

  const invite = (roomId: string, userId: string) => session.hsApi.invite(roomId, userId);
  const disInvite = (roomId: string, userId: string) => session.hsApi.kick(roomId, userId);
  const kick = (roomId: string, userId: string) => session.hsApi.kick(roomId, userId);
  const ban = (roomId: string, userId: string) => session.hsApi.ban(roomId, userId);
  const unban = (roomId: string, userId: string) => session.hsApi.unban(roomId, userId);

  const engine = useMainThreadContext();
  const toggleMute = (userId: string) => toggleMutePeer(engine, userId);

  const renderMemberTile = (member: RoomMember) => {
    const { userId, name, avatarUrl, membership } = member;
    const userPL = getPowerLevel(userId);

    const menuItems: ReactNode[] = [
      // todo: how to get this to rerender right away?
      <DropdownMenuItem key="mute" onSelect={() => toggleMute(userId)}>
        {isPeerMuted(engine, userId) ? "Unmute" : "Mute"}
      </DropdownMenuItem>,
      <DropdownMenuItem key="ignore" onSelect={() => removePeer(engine, userId)}>
        Ignore
      </DropdownMenuItem>,
    ];
    switch (membership) {
      case "join":
        if (canKick && myPL > userPL)
          menuItems.push(
            <DropdownMenuItem key="kick" onSelect={() => kick(room.id, userId)}>
              Kick
            </DropdownMenuItem>
          );
        if (canBan && myPL > userPL)
          menuItems.push(
            <DropdownMenuItem key="ban" onSelect={() => ban(room.id, userId)}>
              Ban
            </DropdownMenuItem>
          );
        break;
      case "ban":
        if (canKick && myPL > userPL)
          menuItems.push(
            <DropdownMenuItem key="unban" onSelect={() => unban(room.id, userId)}>
              Unban
            </DropdownMenuItem>
          );
        break;
      case "invite":
        if (canKick && myPL > userPL)
          menuItems.push(
            <DropdownMenuItem key="disinvite" onSelect={() => disInvite(room.id, userId)}>
              Disinvite
            </DropdownMenuItem>
          );
        break;
      case "leave":
        if (canInvite)
          menuItems.push(
            <DropdownMenuItem key="invite" onSelect={() => invite(room.id, userId)}>
              Invite
            </DropdownMenuItem>
          );
        break;
    }

    return (
      <MemberTile
        key={userId}
        avatar={
          <Avatar
            shape="circle"
            name={name}
            imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 40, platform, session.mediaRepository) : undefined}
            bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
          />
        }
        content={
          <>
            <Text className="truncate" weight="medium">
              {name}
            </Text>
            <Text className="truncate" color="surface-low" variant="b3">
              {userId}
            </Text>
          </>
        }
        options={
          menuItems.length > 0 &&
          userId !== session.userId && (
            <DropdownMenu content={menuItems}>
              <IconButton variant="surface-low" label="Options" iconSrc={MoreHorizontalIC} />
            </DropdownMenu>
          )
        }
      />
    );
  };
  return (
    <>
      <Header
        left={<HeaderTitle size="lg">Members</HeaderTitle>}
        right={
          <div className="flex gap-sm">
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <InviteDialog roomId={room.id} requestClose={() => setInviteOpen(false)} />
            </Dialog>
            {canDoAction("invite", myPL) && (
              <IconButton iconSrc={AddUserIC} onClick={() => setInviteOpen(true)} label="Invite" />
            )}
            <IconButton iconSrc={CrossIC} onClick={requestClose} label="Close" />
          </div>
        }
      />
      <div className="flex" style={{ height: "600px" }}>
        {joined === undefined ? (
          <div className="grow flex items-center justify-center">
            <Dots size="lg" />
          </div>
        ) : (
          <Scroll type="hover" style={{ paddingBottom: "var(--sp-lg)" }}>
            <div className="flex flex-column gap-sm">
              {!!invited?.length && (
                <Category
                  header={
                    <CategoryHeader
                      title="Invited"
                      onClick={() => setInvitedCat(!invitedCat)}
                      after={<Icon src={invitedCat ? ChevronBottomIC : ChevronRightIC} />}
                    />
                  }
                >
                  {invitedCat && invited.map(renderMemberTile)}
                </Category>
              )}

              {!!active?.length && (
                <Category
                  header={
                    <CategoryHeader
                      title="Connected"
                      onClick={() => setActiveCat(!activeCat)}
                      after={<Icon src={activeCat ? ChevronBottomIC : ChevronRightIC} />}
                    />
                  }
                >
                  {activeCat && active.map(renderMemberTile)}
                </Category>
              )}

              {!!joined?.length && (
                <Category
                  header={
                    <CategoryHeader
                      title={isWorld ? "Disconnected" : "Joined"}
                      onClick={() => setJoinedCat(!joinedCat)}
                      after={<Icon src={joinedCat ? ChevronBottomIC : ChevronRightIC} />}
                    />
                  }
                >
                  {joinedCat && joined.map(renderMemberTile)}
                </Category>
              )}

              {!!banned?.length && (
                <Category
                  header={
                    <CategoryHeader
                      title="Banned"
                      onClick={() => setBanCat(!banCat)}
                      after={<Icon src={banCat ? ChevronBottomIC : ChevronRightIC} />}
                    />
                  }
                >
                  {banCat && banned.map(renderMemberTile)}
                </Category>
              )}
              {!!leaved?.length && (
                <Category
                  header={
                    <CategoryHeader
                      title="Archived"
                      onClick={() => setLeaveCat(!leaveCat)}
                      after={<Icon src={leaveCat ? ChevronBottomIC : ChevronRightIC} />}
                    />
                  }
                >
                  {leaveCat && leaved.map(renderMemberTile)}
                </Category>
              )}
            </div>
          </Scroll>
        )}
      </div>
    </>
  );
}
