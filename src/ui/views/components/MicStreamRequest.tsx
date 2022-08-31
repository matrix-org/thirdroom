import { ReactNode, useState } from "react";
import { Platform, Stream } from "@thirdroom/hydrogen-view-sdk";

import { IconButton } from "../../atoms/button/IconButton";
import { Dialog } from "../../atoms/dialog/Dialog";
import { Header } from "../../atoms/header/Header";
import { HeaderTitle } from "../../atoms/header/HeaderTitle";
import { useIsMounted } from "../../hooks/useIsMounted";
import CrossIC from "../../../../res/ic/cross.svg";
import { Text } from "../../atoms/text/Text";

export type RequestStream = () => Promise<Stream | undefined>;
interface MicStreamRequestProps {
  platform: Platform;
  permissionState: PermissionState;
  render: (requestStream: RequestStream) => ReactNode;
}

export enum RequestException {
  NotAllowed = "NotAllowedError",
  NotFound = "NotFoundError",
  Unknown = "Unknown",
}

export function MicStreamRequest({ platform, permissionState, render }: MicStreamRequestProps) {
  const [exception, setException] = useState<RequestException>();
  const isMounted = useIsMounted();

  const requestStream = () =>
    new Promise<Stream | undefined>((resolve) => {
      if (permissionState === "denied") {
        setException(RequestException.NotAllowed);
        return;
      }
      platform.mediaDevices
        .getMediaTracks(true, false)
        .then((stream) => {
          resolve(stream);
        })
        .catch((e) => {
          resolve(undefined);
          if (!isMounted()) return;
          if (e.name === RequestException.NotAllowed) {
            setException(RequestException.NotAllowed);
            return;
          }
          if (e.name === RequestException.NotFound) {
            setException(RequestException.NotFound);
            return;
          }
          setException(RequestException.Unknown);
        });
    });

  return (
    <>
      {exception && (
        <Dialog
          open={exception !== undefined}
          onOpenChange={(open) => {
            if (!open) setException(undefined);
          }}
        >
          <Header
            className="shrink-0"
            left={<HeaderTitle size="lg">Microphone</HeaderTitle>}
            right={<IconButton iconSrc={CrossIC} onClick={() => setException(undefined)} label="Close" />}
          />
          <Text variant="b2" style={{ padding: "0 var(--sp-md) var(--sp-md)" }}>
            {exception === RequestException.NotAllowed &&
              "Access to microphone is denied. Please allow it from browser address bar."}
            {exception === RequestException.NotFound && "No microphone found."}
            {exception === RequestException.Unknown && "Unable to connect access microphone. Unknown error occurs."}
          </Text>
        </Dialog>
      )}
      {render(requestStream)}
    </>
  );
}
