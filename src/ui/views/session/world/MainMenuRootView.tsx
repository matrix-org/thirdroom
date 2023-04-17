import { useAtom } from "jotai";
import { useEffect } from "react";

import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { WorldThumbnail } from "./WorldThumbnail";
import { useWorldLoader } from "../../../hooks/useWorldLoader";

export default function MainMenuRootView() {
  const [{ entered, loading }] = useAtom(worldAtom);
  const { exitWorld } = useWorldLoader();

  /**
   * Make overlay visible when not loading and not entered
   */
  const [, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  useEffect(() => {
    if (!loading && !entered) {
      setOverlayVisibility(true);
    }
  }, [setOverlayVisibility, loading, entered]);

  /**
   * Exit world if we navigated home and we were entered in a world
   */
  useEffect(() => {
    if (entered) {
      exitWorld();
    }
  }, [entered, exitWorld]);

  return (
    <>
      <WorldThumbnail />
    </>
  );
}
