import { useCallback, useState } from "react";

export function useMicrophoneState(permissionState: PermissionState): [isUsable: boolean, toggleState: () => void] {
  const [mic, setMic] = useState(localStorage.getItem("microphone") === "true");
  const isUsable = mic && permissionState === "granted";

  const toggleState = useCallback(() => {
    if (permissionState === "granted") {
      const nextState = !mic;
      setMic(nextState);
      localStorage.setItem("microphone", nextState.toString());
    }
  }, [mic, permissionState]);

  return [isUsable, toggleState];
}
