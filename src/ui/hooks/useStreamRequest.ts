import { Platform, Stream } from "@thirdroom/hydrogen-view-sdk";
import { useCallback } from "react";

export type RequestStream = (
  audio: true,
  video: boolean
) => Promise<[stream: Stream | undefined, exception: RequestException | undefined]>;

export enum RequestException {
  NotAllowed = "NotAllowedError",
  NotFound = "NotFoundError",
  Unknown = "Unknown",
}

export function exceptionToString(exception: RequestException) {
  if (exception === RequestException.NotAllowed)
    return "Access to microphone was denied. Please allow it from browser address bar.";
  if (exception === RequestException.NotFound) return "No microphone found.";
  return "Unable to connect access microphone. Please connect a microphone and refresh the page.";
}

export function useStreamRequest(platform: Platform, permissionState: PermissionState) {
  const requestStream: RequestStream = useCallback(
    (audio, video) =>
      new Promise((resolve) => {
        if (permissionState === "denied") {
          resolve([undefined, RequestException.NotAllowed]);
          return;
        }
        platform.mediaDevices
          .getMediaTracks(audio, video)
          .then((stream) => {
            resolve([stream, undefined]);
          })
          .catch((e) => {
            let exception = RequestException.Unknown;
            if (e.name === RequestException.NotAllowed) {
              exception = RequestException.NotAllowed;
            }
            if (e.name === RequestException.NotFound) {
              exception = RequestException.NotFound;
            }
            resolve([undefined, exception]);
          });
      }),
    [platform, permissionState]
  );

  return requestStream;
}
