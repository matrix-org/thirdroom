import classNames from "classnames";
import { ReactNode } from "react";

import { Button } from "../../../atoms/button/Button";
import { Modal } from "../../../atoms/modal/Modal";
import { Text } from "../../../atoms/text/Text";
import { useSettingsStore } from "../../../hooks/useSettingsStore";
import { GraphicsQualitySetting } from "../../../../engine/renderer/renderer.common";
import "./QualitySelectionView.css";

export interface GraphicsQualityOption {
  label: string;
  value: GraphicsQualitySetting;
  list: string[];
}

export const GraphicsQualityOptions: GraphicsQualityOption[] = [
  {
    value: GraphicsQualitySetting.Low,
    label: "Low",
    list: ["Best Performance", "Good for devices without dedicated graphics cards"],
  },
  {
    value: GraphicsQualitySetting.Medium,
    label: "Medium",
    list: ["Balanced performance and quality.", "Good for most modern devices"],
  },
  {
    value: GraphicsQualitySetting.High,
    label: "High",
    list: ["Best quality at all costs", "Requires a modern dedicated graphics card and CPU"],
  },
];

export function QualityCard({
  selected,
  onClick,
  name,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  name: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames("QualityCard", { "QualityCard--selected": selected }, "flex flex-column gap-xs")}
    >
      <Text weight="bold">{name}</Text>
      <Text variant="b2" type="div">
        {children}
      </Text>
    </button>
  );
}

export function QualitySelectionView({ open, requestClose }: { open: boolean; requestClose?: () => void }) {
  const { settings, setSetting } = useSettingsStore();
  const { quality } = settings;

  const handleQuality = (graphicQuality: GraphicsQualitySetting) => {
    setSetting("quality", graphicQuality);
  };

  const handleNext = () => {
    setSetting("qualityPromptAtStartup", false);
  };

  return (
    <Modal size="sm" className="QualitySelectionView" open={open}>
      <div className="QualitySelectionView__content flex flex-column align-center gap-md">
        <Text className="text-center" variant="s1" weight="bold">
          Select Graphics Quality Setting
        </Text>
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
        </div>
        <div className="flex justify-end">
          <Button onClick={handleNext}>Next</Button>
        </div>
      </div>
    </Modal>
  );
}
