import { useState } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Window } from "../../components/window/Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { useStore } from "../../../hooks/useStore";
import CrossIC from "../../../../../res/ic/cross.svg";
import SettingIC from "../../../../../res/ic/setting.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { useSettingsStore } from "../../../hooks/useSettingsStore";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Label } from "../../../atoms/text/Label";
import { WindowContent } from "../../components/window/WindowContent";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Content } from "../../../atoms/content/Content";
import "./UserSettings.css";
import { GraphicsQualitySetting } from "../../../../engine/renderer/renderer.common";
import { GraphicsQualityOptions, QualityCard } from "../quality-selection/QualitySelectionView";
import { Text } from "../../../atoms/text/Text";

export function UserSettings() {
  const { settings, setSetting } = useSettingsStore();
  const { quality } = settings;
  const { closeWindow } = useStore((state) => state.overlayWindow);
  const [changed, setChanged] = useState(false);

  const handleQuality = (graphicQuality: GraphicsQualitySetting) => {
    setSetting("quality", graphicQuality);
    setChanged(true);
  };

  return (
    <Window onRequestClose={closeWindow}>
      <Header
        left={<HeaderTitle icon={<Icon src={SettingIC} />}>Settings</HeaderTitle>}
        right={<IconButton onClick={() => closeWindow()} iconSrc={CrossIC} label="Close" />}
      />
      <WindowContent
        children={
          <Content
            children={
              <Scroll>
                <div className="UserSettings__content">
                  <div className="flex gap-lg">
                    <SettingTile className="grow basis-0" label={<Label>Graphics Quality</Label>}>
                      <div className="flex flex-column gap-md">
                        {GraphicsQualityOptions.map((graphic) => (
                          <QualityCard
                            key={graphic.value}
                            name={graphic.label}
                            selected={graphic.value === quality}
                            onClick={() => handleQuality(graphic.value)}
                          >
                            <ul>
                              {graphic.list.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </QualityCard>
                        ))}
                        {changed && (
                          <Text variant="b2" weight="semi-bold" color="primary">
                            Refresh page to apply
                          </Text>
                        )}
                      </div>
                    </SettingTile>
                  </div>
                </div>
              </Scroll>
            }
          />
        }
      />
    </Window>
  );
}
