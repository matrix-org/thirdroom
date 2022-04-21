import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import NetworkIC from "../../../../../res/ic/network.svg";

interface INowPlayingStatus {
  status: "connected" | "connecting" | "disconnected";
  children: string;
}

export function NowPlayingStatus({ status, children }: INowPlayingStatus) {
  const color = status === "connected" ? "secondary" : "danger";

  return (
    <div className="NowPlayingStatus flex items-baseline" style={{ gap: "var(--sp-xxs)" }}>
      <Icon color={color} size="xs" src={NetworkIC} />
      <Text color={color} className="truncate" variant="b3" weight="bold">
        {children}
      </Text>
    </div>
  );
}
