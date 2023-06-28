import { IBlobHandle, Session } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useState } from "react";

import { useThrottle } from "./useThrottle";
import { useAttachmentUpload } from "./useAttachmentUpload";

export const useAutoUpload = (session: Session, blob?: IBlobHandle) => {
  const [progress, setProgress] = useState(0);
  const throttledSetProgress = useThrottle(setProgress, 16);
  const { mxc, error, upload, cancel } = useAttachmentUpload(session.hsApi, throttledSetProgress);

  useEffect(() => {
    if (blob) upload(blob);
    else {
      cancel();
      setProgress(0);
    }
  }, [blob, upload, cancel]);

  return {
    progress,
    mxc,
    error,
  };
};
