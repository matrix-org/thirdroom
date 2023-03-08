import { publish, subscribe, unsubscribe } from "@ipsme/msgenv-broadcastchannel";

import {
  InteractableAction,
  InteractionMessage,
  InteractionMessageType,
} from "../../plugins/interaction/interaction.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { InteractableType } from "../resource/schema";

interface IPSMEModuleState {
  worker?: SharedWorker;
}

export const IPSMEModule = defineModule<IMainThreadContext, IPSMEModuleState>({
  name: "ipsme",
  create(ctx) {
    return {};
  },
  init(ctx) {
    const ipsmeModule = getModule(ctx, IPSMEModule);

    ipsmeModule.worker = new SharedWorker(
      new URL("@ipsme/reflector-webbr-ws/dist/reflector-bc-ws-client.js", import.meta.url)
    );
    ipsmeModule.worker.port.start();
    ipsmeModule.worker.port.postMessage({});

    subscribe(onIPSMEMessage);

    return createDisposables([
      registerMessageHandler(ctx, InteractionMessageType, onInteraction),
      () => unsubscribe(onIPSMEMessage),
    ]);
  },
});

function onInteraction(_ctx: IMainThreadContext, message: InteractionMessage) {
  if (message.interactableType === InteractableType.Portal && message.action === InteractableAction.Grab) {
    publish({
      action: "OMI_link",
      uri: message.uri,
    });
    location.href = "/";
  }
}

function onIPSMEMessage(message: unknown) {
  console.info(`Received IPSME Message: ${message}`);
}
