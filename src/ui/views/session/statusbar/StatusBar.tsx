import { Text } from "../../../atoms/text/Text";
import "./StatusBar.css";

function OpenOverlayTip({ text }: { text: string }) {
  return (
    <div className="OpenOverlay">
      <Text className="flex items-center" variant="b3">
        <span>ESC</span>
        {text}
      </Text>
    </div>
  );
}

interface StatusBarProps {
  showOverlayTip?: boolean;
  isOverlayOpen?: boolean;
  title?: string | null;
}

export function StatusBar({ showOverlayTip, isOverlayOpen, title }: StatusBarProps) {
  return (
    <div className="StatusBar shrink-0 flex items-center">
      <div className="StatusBar__left grow basis-0">
        {showOverlayTip && <OpenOverlayTip text={isOverlayOpen ? "Close Overlay" : "Open Overlay"} />}
      </div>
      <div className="StatusBar__center">{title && <Text weight="semi-bold">{title}</Text>}</div>
      <div className="StatusBar__right grow basis-0 flex justify-end">
        <Text variant="b3">0 Notifications</Text>
      </div>
    </div>
  );
}
