import { useState } from "react";

export function useMicrophoneState(): [isUsable: boolean, setState: (nextState: boolean) => void] {
  const [mic, setMic] = useState(localStorage.getItem("microphone") === "true");
  localStorage.setItem("microphone", mic.toString());

  return [mic, setMic];
}
