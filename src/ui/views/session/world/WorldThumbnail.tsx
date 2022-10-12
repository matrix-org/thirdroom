import classNames from "classnames";
import { useEffect, useState } from "react";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useStore } from "../../../hooks/useStore";
import { loadImageUrl } from "../../../utils/common";
import "./WorldThumbnail.css";

export function WorldThumbnail() {
  const selectedWorldId = useStore((state) => state.overlayWorld.selectedWorldId);
  const { worldId, entered } = useStore((state) => state.world);
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);

  const previewId = selectedWorldId ?? worldId;

  const { session } = useHydrogen(true);
  const [worldPreview, setWorldPreview] = useState<{ url?: string; thumbnail: string } | undefined>();
  const isMounted = useIsMounted();

  useEffect(() => {
    let selectedWorldChanged = false;
    const world = previewId ? session.rooms.get(previewId) : undefined;
    if (world) {
      world.getStateEvent("org.matrix.msc3815.world").then((result: any) => {
        const scenePreviewUrl = result?.event?.content?.scene_preview_url as string | unknown;
        let scenePreviewThumbnail = scenePreviewUrl;

        if (typeof scenePreviewUrl === "string" && scenePreviewUrl.startsWith("mxc:")) {
          scenePreviewThumbnail = session.mediaRepository.mxcUrlThumbnail(scenePreviewUrl, 32, 32, "crop");
          const downloadUrl = session.mediaRepository.mxcUrl(scenePreviewUrl);
          if (downloadUrl)
            loadImageUrl(downloadUrl).then((url) => {
              if (selectedWorldChanged || !isMounted()) return;
              setWorldPreview({
                url,
                thumbnail: url,
              });
            });
        }

        if (typeof scenePreviewThumbnail === "string")
          setWorldPreview({
            thumbnail: scenePreviewThumbnail,
          });
      });
    } else {
      setWorldPreview(undefined);
    }
    return () => {
      selectedWorldChanged = true;
    };
  }, [session, previewId, isMounted]);

  if ((!isOverlayOpen || worldId === selectedWorldId) && entered) return <></>;
  return (
    <div className={classNames("WorldThumbnail", { "WorldThumbnail--blur": worldPreview && !worldPreview?.url })}>
      {worldPreview && <img alt="World Preview" src={worldPreview.url ?? worldPreview.thumbnail} />}
    </div>
  );
}
