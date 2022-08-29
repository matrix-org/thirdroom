import React from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import "./NowPlayingControls.css";
import usePermissionState from "../../../hooks/usePermissionState";

export function NowPlayingControls() {
  const micPermission = usePermissionState("microphone");

  return (
    <div className="NowPlayingControls shrink-0 flex items-center">
      <Tooltip content={micPermission === "granted" ? "Mute" : "Unmute"}>
        <IconButton variant="surface-low" label="Mic" iconSrc={micPermission === "granted" ? MicIC : MicOffIC} />
      </Tooltip>
    </div>
  );
}
