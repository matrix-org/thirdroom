import {
  addComponent,
  defineComponent,
  defineQuery,
  Types,
  Not,
  exitQuery,
  enterQuery,
  addEntity,
} from "bitecs";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { GroupCallParticipant } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCallParticipant";
import { World } from "./World";

export enum NetworkMessageType {
  Create = 0,
  Update = 1,
  Delete = 2,
}

export interface NetworkMessage {
  type: NetworkMessageType;
  sender: GroupCallParticipant;
  networkId: number;
  templateId?: number;
  lastOwned?: number;
  data?: any;
}

export const Networked = defineComponent({
  networkId: Types.ui32,
  templateId: Types.ui32,
  ownerId: Types.ui32,
  lastOwned: Types.ui32,
  sent: Types.ui8,
});

const updatedNetworkedQuery = defineQuery([Networked]);
const createdNetworkedQuery = enterQuery(updatedNetworkedQuery);
const deletedNetworkedQuery = exitQuery(updatedNetworkedQuery);

export function isMine(world: World, eid: number) {
  return Networked.ownerId[eid] === world.localParticipantId;
}

export function isMessageSenderOwner(
  message: NetworkMessage,
  world: World,
  eid: number
) {
  if (message.lastOwned! > Networked.lastOwned[eid]) {
    return true;
  }

  const localOwnerId = Networked.ownerId[eid];
  const localOwner = world.participantIdToParticipant.get(localOwnerId)!;
  const senderMxId = message.sender.member.userId;

  return (
    message.lastOwned === Networked.lastOwned[eid] &&
    senderMxId > localOwner.member.userId
  );
}

export function takeOwnership(world: World, eid: number) {
  Networked.ownerId[eid] = world.localParticipantId;
  Networked.lastOwned[eid] = performance.now(); // TODO: use network time
}

export function getNetworkTemplateId(
  world: World,
  networkTemplate: NetworkTemplate
): number | undefined {
  return world.networkTemplateIds.get(networkTemplate);
}

export function registerNetworkTemplate(
  world: World,
  networkTemplate: NetworkTemplate
) {
  const networkTemplateId = world.networkTemplates.length;
  world.networkTemplateIds.set(networkTemplate, networkTemplateId);
  world.networkTemplates.push(networkTemplate);
  return networkTemplateId;
}

const MAX_NETWORKED_OBJECTS = 1024;
let nextNetworkIdIndex = 0;
const networkIds = crypto.getRandomValues(
  new Uint32Array(MAX_NETWORKED_OBJECTS)
);

export function createNetworkId(): number {
  return networkIds[nextNetworkIdIndex++];
}

export function addNetworkedComponent(
  world: World,
  eid: number,
  templateId: number
) {
  addComponent(world, Networked, eid);
  Networked.templateId[eid] = templateId;
  Networked.networkId[eid] = createNetworkId();
  Networked.lastOwned[eid] = performance.now(); // TODO: use network time
  Networked.ownerId[eid] = world.localParticipantId;
}

interface ParticipantChannel {
  datachannel: RTCDataChannel;
  firstSync: boolean;
}

export interface NetworkTemplate {
  onCreate: (
    world: World,
    sender: GroupCallParticipant,
    entityId: number,
    networkId: number,
    data: any
  ) => void;
  onUpdate: (
    world: World,
    sender: GroupCallParticipant,
    entityId: number,
    networkId: number,
    data: any
  ) => void;
  onDelete: (
    world: World,
    sender: GroupCallParticipant,
    entityId: number,
    networkId: number
  ) => void;
  sendCreate: (world: World, entityId: number, networkId: number) => any;
  sendUpdate: (world: World, entityId: number, networkId: number) => any;
}

let nextParticipantId = 0;

export function NetworkingModule(
  world: World,
  {
    groupCall,
    networkTickInterval,
  }: { groupCall: GroupCall; networkTickInterval: number }
) {
  const participantChannels: {
    datachannel: RTCDataChannel;
    firstSync: boolean;
  }[] = [];
  const inboundNetworkMessages: NetworkMessage[] = [];
  let lastNetworkTick = 0;

  world.networkTemplates = [];
  world.networkTemplateIds = new Map();
  world.networkIdToEntity = new Map();
  world.localParticipantId = nextParticipantId++;
  world.participantToParticipantId = new Map([
    [groupCall.localParticipant, world.localParticipantId],
  ]);
  world.participantIdToParticipant = new Map([
    [world.localParticipantId, groupCall.localParticipant],
  ]);

  const onDatachannel = (
    datachannel: RTCDataChannel,
    sender: GroupCallParticipant
  ) => {
    let participantChannel: ParticipantChannel;
    let participantId: number;

    function onDatachannelOpen() {
      participantChannel = { datachannel, firstSync: true };
      participantChannels.push(participantChannel);
      participantId = nextParticipantId++;
      world.participantToParticipantId.set(sender, participantId);
      world.participantIdToParticipant.set(participantId, sender);
    }

    if (datachannel.readyState === "open") {
      onDatachannelOpen();
    } else {
      datachannel.addEventListener("open", onDatachannelOpen);
    }

    datachannel.addEventListener("message", (event) => {
      const {
        t: type,
        n: networkId,
        x: templateId,
        o: lastOwned,
        d: data,
      } = JSON.parse(event.data);

      inboundNetworkMessages.push({
        type,
        sender,
        networkId,
        templateId,
        data,
        lastOwned,
      });
    });

    datachannel.addEventListener("close", () => {
      const index = participantChannels.indexOf(participantChannel);

      if (index !== -1) {
        participantChannels.splice(index, 1);
      }

      world.participantToParticipantId.delete(sender);
      world.participantIdToParticipant.delete(participantId);
    });
  };

  groupCall.on("datachannel", onDatachannel);

  const ReceiveMessagesSystem = (world: World) => {
    while (inboundNetworkMessages.length) {
      // TODO: Support unordered / unreliable messages
      const message = inboundNetworkMessages.pop() as NetworkMessage;

      if (message.type === NetworkMessageType.Create) {
        const eid = addEntity(world);
        addComponent(world, Networked, eid);
        Networked.templateId[eid] = message.templateId!;
        Networked.networkId[eid] = message.networkId;
        Networked.lastOwned[eid] = message.lastOwned!;
        Networked.ownerId[eid] = world.participantToParticipantId.get(
          message.sender
        )!;
        const template = world.networkTemplates[message.templateId!];
        world.networkIdToEntity.set(message.networkId, eid);

        template.onCreate(
          world,
          message.sender,
          eid,
          message.networkId,
          message.data
        );
      } else if (message.type === NetworkMessageType.Update) {
        const entityId = world.networkIdToEntity.get(message.networkId)!;
        const templateId = Networked.templateId[entityId];
        const template = world.networkTemplates[templateId];

        if (!template) {
          continue;
        }

        template.onUpdate(
          world,
          message.sender,
          entityId,
          message.networkId,
          message.data
        );
      } else if (message.type === NetworkMessageType.Delete) {
        const entityId = world.networkIdToEntity.get(message.networkId)!;
        const templateId = Networked.templateId[entityId];
        const template = world.networkTemplates[templateId];

        template.onDelete(world, message.sender, entityId, message.networkId);
      }
    }

    return world;
  };

  function broadcastCreateMessage(
    networkId: number,
    lastOwned: number,
    templateId: number,
    data: any
  ) {
    const createPayload = JSON.stringify({
      t: NetworkMessageType.Create,
      n: networkId,
      x: templateId,
      o: lastOwned,
      d: data,
    });

    for (let i = 0; i < participantChannels.length; i++) {
      participantChannels[i].datachannel.send(createPayload);
    }
  }

  function broadcastUpdateMessage(
    networkId: number,
    lastOwned: number,
    templateId: number,
    data: any
  ) {
    const createPayload = JSON.stringify({
      t: NetworkMessageType.Create,
      n: networkId,
      x: templateId,
      o: lastOwned,
      d: data,
    });

    // TODO: Delta compression
    const updatePayload = JSON.stringify({
      t: NetworkMessageType.Update,
      n: networkId,
      o: lastOwned,
      d: data,
    });

    for (let i = 0; i < participantChannels.length; i++) {
      const participantChannel = participantChannels[i];

      let payload;

      if (participantChannel.firstSync) {
        payload = createPayload;
      } else {
        payload = updatePayload;
      }

      participantChannel.datachannel.send(payload);
    }
  }

  function broadcastDeleteMessage(networkId: number) {
    const deletePayload = JSON.stringify({
      t: NetworkMessageType.Delete,
      n: networkId,
    });

    for (let i = 0; i < participantChannels.length; i++) {
      participantChannels[i].datachannel.send(deletePayload);
    }
  }

  const SendMessagesSystem = (world: World) => {
    const now = performance.now(); // TODO: use network time

    if (now - lastNetworkTick >= networkTickInterval) {
      const createdEntities = createdNetworkedQuery(world);
      const updatedEntities = updatedNetworkedQuery(world);
      const deletedEntities = deletedNetworkedQuery(world);

      for (let i = 0; i < createdEntities.length; i++) {
        const entityId = createdEntities[i];

        if (!isMine(world, entityId)) {
          continue;
        }

        const networkId = Networked.networkId[entityId];
        const templateId = Networked.templateId[entityId];
        const lastOwned = Networked.lastOwned[entityId];
        const template = world.networkTemplates[templateId];
        const data = template.sendCreate(world, entityId, networkId);
        broadcastCreateMessage(networkId, lastOwned, templateId, data);
      }

      for (let i = 0; i < updatedEntities.length; i++) {
        const entityId = updatedEntities[i];

        if (!isMine(world, entityId)) {
          continue;
        }

        const networkId = Networked.networkId[entityId];
        const templateId = Networked.templateId[entityId];
        const lastOwned = Networked.lastOwned[entityId];
        const template = world.networkTemplates[templateId];
        const data = template.sendUpdate(world, entityId, networkId);
        broadcastUpdateMessage(networkId, lastOwned, templateId, data);
      }

      for (let i = 0; i < deletedEntities.length; i++) {
        const entityId = deletedEntities[i];

        if (!isMine(world, entityId)) {
          continue;
        }

        const networkId = Networked.networkId[entityId];
        broadcastDeleteMessage(networkId);
      }

      for (let i = 0; i < participantChannels.length; i++) {
        participantChannels[i].firstSync = false;
      }

      lastNetworkTick = now;
    }

    return world;
  };

  const dispose = () => {
    for (const { datachannel } of participantChannels) {
      datachannel.close();
    }

    groupCall.removeListener("datachannel", onDatachannel);
  };

  return { ReceiveMessagesSystem, SendMessagesSystem, dispose };
}
