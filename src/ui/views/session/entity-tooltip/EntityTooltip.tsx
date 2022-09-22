import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { InteractableType } from "../../../../plugins/interaction/interaction.common";
import { Icon } from "../../../atoms/icon/Icon";
import { Text } from "../../../atoms/text/Text";
import { ActiveEntityState } from "../world/WorldView";
import "./EntityTooltip.css";

interface EntityTooltipProps {
  activeEntity: ActiveEntityState;
}

export function EntityTooltip({ activeEntity }: EntityTooltipProps) {
  return (
    <div>
      <div className="EntityTooltip">
        {activeEntity.interactableType === InteractableType.Player && (
          <>
            <Text weight="bold" color="world">
              {activeEntity.name}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {activeEntity.peerId}
              </Text>
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span>
                <span> More Info</span>
              </Text>
            </div>
          </>
        )}
        {activeEntity.interactableType === InteractableType.Object && (
          <>
            <Text weight="bold" color="world">
              {activeEntity.name}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {activeEntity.ownerId}
              </Text>
              {activeEntity.held ? (
                <>
                  <Text variant="b3" color="world">
                    <span className="EntityTooltip__boxedKey">E</span>
                    <span> Drop</span>
                  </Text>
                  <Text variant="b3" color="world">
                    <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                    <span> Throw</span>
                  </Text>
                </>
              ) : (
                <Text variant="b3" color="world">
                  <span className="EntityTooltip__boxedKey">E</span> /
                  <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                  <span> Grab</span>
                </Text>
              )}
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">X</span>
                <span> Delete</span>
              </Text>
            </div>
          </>
        )}
        {activeEntity.interactableType === InteractableType.Portal && (
          <>
            <Text weight="bold" color="world">
              Portal
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {activeEntity.name}
              </Text>
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span> /
                <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                <span> Enter World</span>
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
