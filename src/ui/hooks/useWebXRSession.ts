import { useEffect, useState } from "react";

import { Thread } from "../../engine/module/module.common";
import { EnterXRMessage, RendererMessageType } from "../../engine/renderer/renderer.common";
import { useAsyncCallback } from "./useAsyncCallback";
import { useLocalStorage } from "./useLocalStorage";
import { useMainThreadContext } from "./useMainThread";

const DefaultXRInit = { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"] };

export function useWebXRSession() {
  const ctx = useMainThreadContext();
  const [immersiveAR] = useLocalStorage("feature_immersiveAR", false);

  const [isPresenting, setIsPresenting] = useState(false);

  const {
    callback: enterXR,
    loading: enteringXR,
    value: session,
    error: webXRSessionError,
  } = useAsyncCallback<() => Promise<XRSession | undefined>, XRSession | undefined>(async () => {
    if ("xr" in navigator && navigator.xr && ctx.supportedXRSessionModes) {
      if (isPresenting) {
        return;
      }

      const mode =
        immersiveAR && ctx.supportedXRSessionModes.includes("immersive-ar") ? "immersive-ar" : "immersive-vr";

      console.log(immersiveAR, ctx.supportedXRSessionModes);

      const session = await navigator.xr.requestSession(mode, DefaultXRInit);

      ctx.sendMessage<EnterXRMessage>(Thread.Render, {
        type: RendererMessageType.EnterXR,
        session,
        mode,
      });

      return session;
    }

    return undefined;
  }, [ctx, isPresenting, immersiveAR]);

  useEffect(() => {
    if (session) {
      setIsPresenting(true);

      const onSessionEnd = () => setIsPresenting(false);

      session.addEventListener("end", onSessionEnd);

      return () => {
        session.removeEventListener("end", onSessionEnd);
      };
    }
  }, [session]);

  return {
    enteringXR,
    isPresenting,
    isWebXRSupported: !!ctx.supportedXRSessionModes,
    error: webXRSessionError,
    enterXR,
  };
}
