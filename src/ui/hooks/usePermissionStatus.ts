import { useEffect, useState } from "react";

type PermissionName =
  | "geolocation"
  | "notifications"
  | "push"
  | "midi"
  | "camera"
  | "microphone"
  | "speaker"
  | "device-info"
  | "background-sync"
  | "bluetooth"
  | "persistent-storage"
  | "ambient-light-sensor"
  | "accelerometer"
  | "gyroscope"
  | "magnetometer"
  | "clipboard"
  | "geolocation"
  | "notifications"
  | "push"
  | "midi"
  | "camera"
  | "microphone"
  | "speaker"
  | "device-info"
  | "background-sync"
  | "bluetooth"
  | "persistent-storage"
  | "ambient-light-sensor"
  | "accelerometer"
  | "gyroscope"
  | "magnetometer"
  | "accessibility-events"
  | "clipboard-read"
  | "clipboard-write"
  | "payment-handler";

export default function usePermissionStatus(name: PermissionName) {
  const [state, setState] = useState<PermissionState>("prompt");

  useEffect(() => {
    let permissionStatus: PermissionStatus;

    function handlePermissionChange(this: PermissionStatus) {
      setState(this.state);
    }

    navigator.permissions
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/33923
      .query({ name })
      .then((permStatus: PermissionStatus) => {
        permissionStatus = permStatus;
        handlePermissionChange.apply(permStatus);
        permStatus.addEventListener("change", handlePermissionChange);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      permissionStatus?.removeEventListener("change", handlePermissionChange);
    };
  }, [name]);

  return state;
}
