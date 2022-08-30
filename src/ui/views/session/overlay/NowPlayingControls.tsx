import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import "./NowPlayingControls.css";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { useMicrophone } from "../../../hooks/useMicrophone";
import { MicPermissionRequest } from "../../components/MicPermissionRequest";

export function NowPlayingControls() {
  const micPermission = usePermissionState("microphone");
  const [microphone, toggleMicrophone] = useMicrophone(micPermission);

  return (
    <div className="NowPlayingControls shrink-0 flex items-center">
      <MicPermissionRequest
        permissionState={micPermission}
        render={(requestPerm) => (
          <Tooltip content={microphone ? "Mute" : "Unmute"}>
            <IconButton
              variant="surface-low"
              label="Mic"
              iconSrc={microphone ? MicIC : MicOffIC}
              onClick={() => {
                if (micPermission == "granted") toggleMicrophone();
                else requestPerm();
              }}
            />
          </Tooltip>
        )}
      />
    </div>
  );
}
