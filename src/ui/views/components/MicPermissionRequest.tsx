import { ReactNode, useState } from "react";

import { IconButton } from "../../atoms/button/IconButton";
import { Dialog } from "../../atoms/dialog/Dialog";
import { Header } from "../../atoms/header/Header";
import { HeaderTitle } from "../../atoms/header/HeaderTitle";
import { useIsMounted } from "../../hooks/useIsMounted";
import CrossIC from "../../../../res/ic/cross.svg";
import { Text } from "../../atoms/text/Text";

interface MicPermissionRequestProps {
  permissionState: PermissionState;
  render: (requestPermission: () => void) => ReactNode;
}

enum RequestException {
  NotAllowed = "NotAllowedError",
  NotFound = "NotFoundError",
  Unknown = "Unknown",
}

export function MicPermissionRequest({ permissionState, render }: MicPermissionRequestProps) {
  const [exception, setException] = useState<RequestException>();
  const isMounted = useIsMounted();

  const requestPermission = () => {
    if (permissionState === "denied") {
      setException(RequestException.NotAllowed);
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).catch((e) => {
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
  };

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
      {render(requestPermission)}
    </>
  );
}
