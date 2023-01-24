import { useEffect, useState } from "react";

import { Thread } from "../../engine/module/module.common";
import { EnterXRMessage, RendererMessageType } from "../../engine/renderer/renderer.common";
import { useAsync } from "./useAsync";
import { useAsyncCallback } from "./useAsyncCallback";
import { useMainThreadContext } from "./useMainThread";

const DefaultXRInit = { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"] };

export function useWebXRSession(mode: XRSessionMode = "immersive-vr", xrSessionInit: XRSessionInit = DefaultXRInit) {
  const ctx = useMainThreadContext();

  const [isPresenting, setIsPresenting] = useState(false);

  const {
    loading: checkingWebXRSupport,
    value: isWebXRSupported,
    error: webXRSupportError,
  } = useAsync(
    async () => "xr" in navigator && navigator.xr !== undefined && (await navigator.xr.isSessionSupported(mode)),
    [mode]
  );

  const {
    callback: enterXR,
    loading: enteringXR,
    value: session,
    error: webXRSessionError,
  } = useAsyncCallback<() => Promise<XRSession | undefined>, XRSession | undefined>(async () => {
    if ("xr" in navigator && navigator.xr) {
      const session = await navigator.xr.requestSession(mode, xrSessionInit);

      ctx.sendMessage<EnterXRMessage>(Thread.Render, {
        type: RendererMessageType.EnterXR,
        session,
      });

      return session;
    }

    return undefined;
  }, [ctx, mode, xrSessionInit]);

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
    checkingWebXRSupport,
    isPresenting,
    isWebXRSupported,
    error: webXRSupportError || webXRSessionError,
    enterXR,
  };
}
