import { StatusBarViewModel } from "../../../../viewModels/session/statusbar/StatusBarViewModel";
import { Text } from "../../../atoms/text/Text";
import { useVMProp } from "../../../hooks/useVMProp";
import "./StatusBar.css";

function OpenOverlayBtn({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button className="OpenOverlay" onClick={onClick}>
      <Text className="flex items-center" variant="b3">
        <span>ESC</span>
        {text}
      </Text>
    </button>
  );
}

export function StatusBar({ vm }: { vm: StatusBarViewModel }) {
  const overlayBtnVisibility = useVMProp(vm, "overlayBtnVisibility");
  const leftPanelState = useVMProp(vm, "leftPanelState");
  const selectedRoomName = useVMProp(vm, "selectedRoomName");

  return (
    <div className="StatusBar shrink-0 flex items-center">
      <div className="StatusBar__left grow basis-0">
        {overlayBtnVisibility && (
          <OpenOverlayBtn
            text={leftPanelState === "close" ? "Open Overlay" : "Close Overlay"}
            onClick={() => vm.toggleLeftPanel()}
          />
        )}
      </div>
      <div className="StatusBar__center">{selectedRoomName && <Text weight="semi-bold">{selectedRoomName}</Text>}</div>
      <div className="StatusBar__right grow basis-0 flex justify-end">
        <Text variant="b3">0 Notifications</Text>
      </div>
    </div>
  );
}
