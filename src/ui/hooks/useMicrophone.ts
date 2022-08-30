import { useCallback, useState } from "react";

export function useMicrophone(permissionState: PermissionState): [boolean, () => void] {
  const [mic, setMic] = useState(localStorage.getItem("microphone") === "true");
  const isUsable = mic && permissionState === "granted";

  const toggleMicrophone = useCallback(() => {
    if (permissionState === "granted") {
      const nextState = !mic;
      setMic(nextState);
      localStorage.setItem("microphone", nextState.toString());
    }
  }, [mic, permissionState]);

  return [isUsable, toggleMicrophone];
}
