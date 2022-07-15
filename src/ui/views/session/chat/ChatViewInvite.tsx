import { Session } from "@thirdroom/hydrogen-view-sdk";

import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { Dots } from "../../../atoms/loading/Dots";
import { useInviteControl } from "../../../hooks/useInviteControl";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getIdentifierColorNumber } from "../../../utils/avatar";

interface ChatViewInviteProps {
  session: Session;
  roomId: string;
}
export function ChatViewInvite({ session, roomId }: ChatViewInviteProps) {
  const { invite, accept, reject } = useInviteControl(session, roomId);

  if (invite === undefined) return <Text className="grow flex justify-center items-center">Failed to load invite</Text>;

  return (
    <div
      style={{ padding: "var(--sp-md)" }}
      className="grow text-center flex flex-column justify-center items-center gap-md"
    >
      <Avatar
        imageSrc={invite.avatarUrl}
        size="lg"
        name={invite.name || "Unnamed Room"}
        bgColor={`var(--usercolor${getIdentifierColorNumber(invite.id)})`}
      />
      <Text>
        <b>{invite.inviter.name}</b> invites you to <b>{invite.name || "Unnamed Room"}</b>.
      </Text>
      <div className="flex gap-xs">
        {!(invite.accepting || invite.accepted) && (
          <Button fill="outline" onClick={reject} disabled={invite.rejecting}>
            {invite.rejecting ? <Dots color="primary" /> : "Reject"}
          </Button>
        )}
        {!(invite.rejecting || invite.rejected) && (
          <Button onClick={accept} disabled={invite.accepting}>
            {invite.accepting ? <Dots color="on-primary" /> : "Accept"}
          </Button>
        )}
      </div>
    </div>
  );
}
