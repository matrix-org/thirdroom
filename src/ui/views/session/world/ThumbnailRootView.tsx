import { useAtom } from "jotai";
import { useEffect } from "react";

import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { WorldThumbnail } from "./WorldThumbnail";

export default function ThumbnailRootView() {
  const [{ entered, loading }] = useAtom(worldAtom);

  const [, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  useEffect(() => {
    if (!loading && !entered) {
      setOverlayVisibility(true);
    }
  }, [setOverlayVisibility, loading, entered]);

  return (
    <>
      <WorldThumbnail />
    </>
  );
}
