import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { InteractableType } from "../../../../engine/resource/schema";
import { Icon } from "../../../atoms/icon/Icon";
import { Dots } from "../../../atoms/loading/Dots";
import { Text } from "../../../atoms/text/Text";
import { InteractionState } from "../../../hooks/useWorldInteraction";
import { IInteractionProcess } from "../world/WorldInteraction";
import "./EntityTooltip.css";

interface EntityTooltipProps {
  activeEntity: InteractionState;
  interactionProcess: IInteractionProcess;
}

export function EntityTooltip({ activeEntity, interactionProcess }: EntityTooltipProps) {
  return (
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
      {activeEntity.interactableType === InteractableType.Interactable && (
        <>
          <Text weight="bold" color="world">
            {activeEntity.name}
          </Text>
          <div className="flex flex-column gap-xxs">
            <Text variant="b3" color="world">
              <span className="EntityTooltip__boxedKey">E</span> /
              <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
              <span> Interact</span>
            </Text>
          </div>
        </>
      )}
      {activeEntity.interactableType === InteractableType.UI && (
        <>
          <Text weight="bold" color="world">
            {activeEntity.name}
          </Text>
          <div className="flex flex-column gap-xxs">
            <Text variant="b3" color="world">
              <span className="EntityTooltip__boxedKey">E</span> /
              <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
              <span> Interact</span>
            </Text>
          </div>
        </>
      )}
      {activeEntity.interactableType === InteractableType.Grabbable && (
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
            {activeEntity.ownerId === activeEntity.peerId && (
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">X</span>
                <span> Delete</span>
              </Text>
            )}
          </div>
        </>
      )}
      {activeEntity.interactableType === InteractableType.Portal && (
        <>
          {interactionProcess.loading && <Dots color="world" size="sm" />}
          <Text weight="bold" color="world">
            {interactionProcess.loading ? "Joining portal" : "Portal"}
          </Text>
          <div className="flex flex-column gap-xxs">
            <Text variant="b3" color="world">
              {activeEntity.name}
            </Text>
            {interactionProcess.error && (
              <Text variant="b3" color="world">
                {interactionProcess.error.message ?? "Unknown error joining portal."}
              </Text>
            )}
            {!interactionProcess.loading && (
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span> /
                <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                <span> Enter World</span>
              </Text>
            )}
          </div>
        </>
      )}
      {activeEntity.interactableType === InteractableType.Screenshare && (
        <>
          {interactionProcess.loading && <Dots color="world" size="sm" />}
          <Text weight="bold" color="world">
            {interactionProcess.loading ? "Sharing screen" : "Share screen"}
          </Text>
          <div className="flex flex-column gap-xxs">
            <Text variant="b3" color="world">
              {activeEntity.name}
            </Text>
            {interactionProcess.error && (
              <Text variant="b3" color="world">
                {`Failed to share screen: ${interactionProcess.error.message}`}
              </Text>
            )}
            {!interactionProcess.loading && (
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span> /
                <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                <span> Share your screen</span>
              </Text>
            )}
          </div>
        </>
      )}
    </div>
  );
}
