import { useState, useCallback, useEffect } from "react";
import { GroupCall, Stream } from "@thirdroom/hydrogen-view-sdk";

export function useCallMute(call?: GroupCall) {
  const getMuteState = useCallback(() => {
    return call?.muteSettings?.microphone ?? false;
  }, [call]);

  const [mute, setMute] = useState(getMuteState());

  useEffect(() => {
    setMute(getMuteState());
    return call?.disposableOn("change", () => {
      setMute(getMuteState());
    });
  }, [call, getMuteState]);

  const toggleMute = useCallback(() => {
    if (!call) return;

    const { muteSettings } = call;

    const newMuteState = !getMuteState();

    setMute(newMuteState);

    if (!muteSettings) {
      setMute(getMuteState());
      return;
    }

    setTimeout(async () => {
      await call.setMuted(muteSettings.toggleMicrophone());
      setMute(getMuteState());
    });

    return newMuteState;
  }, [call, getMuteState]);

  const handleMute = async (requestStream: () => Promise<Stream | undefined>) => {
    if (!call) return;
    if (call.localMedia?.userMedia) {
      toggleMute();
      return;
    }

    const stream = await requestStream();
    if (!stream) return;
    const localMedia = call.localMedia?.withUserMedia(stream);
    if (!localMedia) return;
    call.setMedia(localMedia);
  };

  return { mute, toggleMute, handleMute };
}
