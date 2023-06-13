import { useAtom, useAtomValue } from "jotai";

import { useWhatsNew } from "../../../hooks/useWhatsNew";
import { webSGTutDialogAtom, whatsNewDialogAtom } from "../../../state/whatsNew";
import CrossIC from "../../../../../res/ic/cross.svg";
import { IconButton } from "../../../atoms/button/IconButton";
import { Text } from "../../../atoms/text/Text";

export function WhatsNewNotification() {
  const { whatsNew, finishWhatsNew } = useWhatsNew();

  const [whatsNewDialog, setWhatsNewDialog] = useAtom(whatsNewDialogAtom);
  const webSGTutDialog = useAtomValue(webSGTutDialogAtom);

  if (!whatsNew || whatsNewDialog || webSGTutDialog) {
    return null;
  }
  return (
    <div
      className="flex items-center gap-xxs"
      style={{
        padding: "var(--sp-xxs) var(--sp-xs)",
        background: "var(--bg-primary)",
        borderRadius: "var(--br-xs)",
      }}
    >
      <div className="shrink-0 flex">
        <IconButton
          variant="on-primary"
          size="sm"
          iconSrc={CrossIC}
          label="Close"
          onClick={() => {
            if (window.confirm("This action is permanent. Are you sure?")) finishWhatsNew();
          }}
        />
      </div>
      <button
        className="grow flex items-center"
        style={{ cursor: "pointer" }}
        type="button"
        onClick={() => setWhatsNewDialog(true)}
      >
        <Text variant="b3" className="truncate" type="span" color="on-primary" weight="medium">
          The Creator Update is out! 🎉
        </Text>
      </button>
    </div>
  );
}
