import { useState, useCallback, useEffect } from "react";
import { GroupCall } from "@thirdroom/hydrogen-view-sdk";

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

  return { mute, toggleMute };
}
