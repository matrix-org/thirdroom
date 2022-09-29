import { useSettingsStore } from "../../hooks/useSettingsStore";
import { QualitySelectionView } from "./quality-selection/QualitySelectionView";
import SessionView from "./SessionView";
import defaultWorlds from "../.././../../res/defaultWorlds.json";
import { getAvatarHttpUrl } from "../../utils/avatar";
import { useHydrogen } from "../../hooks/useHydrogen";
import "./ClientView.css";

export default function ClientView() {
  const { session, platform } = useHydrogen(true);
  const { qualityPromptAtStartup } = useSettingsStore((state) => state.settings);

  const scenePreviewUrl = getAvatarHttpUrl(defaultWorlds.home.scenePreviewUrl, 24, platform, session.mediaRepository);

  if (qualityPromptAtStartup)
    return (
      <div style={{ backgroundImage: `url(${scenePreviewUrl})` }} className="QualitySelectionView__wrapper">
        <QualitySelectionView open={true} />;
      </div>
    );
  return <SessionView />;
}
