import { useEffect } from "react";

import { MainContext } from "../../engine/MainThread";
import { registerMessageHandler } from "../../engine/module/module.common";
import { InteractableType } from "../../engine/resource/schema";
import { createDisposables } from "../../engine/utils/createDisposables";
import {
  InteractableAction,
  InteractionMessage,
  InteractionMessageType,
} from "../../plugins/interaction/interaction.common";
import { ExitedWorldMessage, ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { parseMatrixUri, parsedMatrixUriToString } from "../utils/matrixUtils";

export interface InteractionState {
  interactableType: InteractableType;
  action: InteractableAction;
  name: string;
  held: boolean;
  peerId?: string;
  ownerId?: string;
  uri?: string;
}

export function useWorldInteraction(ctx: MainContext, interactionCallback: (interaction?: InteractionState) => void) {
  useEffect(() => {
    const handleInteraction = async (ctx: MainContext, message: InteractionMessage) => {
      const { interactableType, action } = message;

      if (!interactableType || action === InteractableAction.Unfocus) {
        interactionCallback(undefined);
        return;
      }

      if ([InteractableType.Grabbable, InteractableType.Interactable, InteractableType.UI].includes(interactableType)) {
        interactionCallback({
          interactableType,
          action,
          name: message.name || "Object",
          held: message.held || false,
          ownerId: message.ownerId,
        });
        return;
      }

      if (interactableType === InteractableType.Player) {
        const { peerId } = message;
        interactionCallback({
          interactableType,
          action,
          name: "Player",
          peerId,
          held: false,
        });
        return;
      }

      if (interactableType === InteractableType.Portal) {
        interactionCallback({
          interactableType,
          action,
          name: (message.uri && parsedMatrixUriToString(parseMatrixUri(message.uri))) || "Portal",
          held: false,
          uri: message.uri,
        });
        return;
      }
    };

    const onExitedWorld = (ctx: MainContext, message: ExitedWorldMessage) => {
      interactionCallback(undefined);
    };

    const disposables = createDisposables([
      registerMessageHandler(ctx, InteractionMessageType, handleInteraction),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitedWorld, onExitedWorld),
    ]);
    return disposables;
  }, [ctx, interactionCallback]);
}
