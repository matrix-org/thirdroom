import { Text } from "../../../atoms/text/Text";
import { closeOverlay, closeWorldChat, openOverlay, useStore } from "../../../hooks/useStore";
import "./StatusBar.css";

function OpenOverlayTip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button className="OpenOverlay" onClick={onClick} type="button">
      <Text className="flex items-center" color="world" variant="b3">
        <span>ESC</span>
        {text}
      </Text>
    </button>
  );
}

interface StatusBarProps {
  showOverlayTip?: boolean;
  title?: string | null;
}

export function StatusBar({ showOverlayTip, title }: StatusBarProps) {
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);

  const handleTipClick = () => {
    if (isOverlayOpen) {
      closeOverlay();
    } else {
      document.exitPointerLock();
      closeWorldChat();
      openOverlay();
    }
  };

  return (
    <div className="StatusBar shrink-0 flex items-center">
      <div className="StatusBar__left grow basis-0">
        {showOverlayTip && (
          <OpenOverlayTip onClick={handleTipClick} text={isOverlayOpen ? "Close Overlay" : "Open Overlay"} />
        )}
      </div>
      <div className="StatusBar__center">
        {title && (
          <Text color="world" weight="semi-bold">
            {title}
          </Text>
        )}
      </div>
      <div className="StatusBar__right grow basis-0 flex justify-end">
        <Text variant="b3" color="world">
          0 Notifications
        </Text>
      </div>
    </div>
  );
}
