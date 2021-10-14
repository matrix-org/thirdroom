import {
  addComponent,
  defineComponent,
  defineQuery,
  Types,
  exitQuery,
  enterQuery,
  addEntity,
} from "bitecs";
import { World } from "./World";

export enum NetworkMessageType {
  Create = 0,
  Update = 1,
  Delete = 2,
}

export interface NetworkMessage {
  type: NetworkMessageType;
  senderId: number;
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
  return Networked.ownerId[eid] === world.localUserParticipantId;
}

export function isMessageSenderOwner(message: NetworkMessage, eid: number) {
  if (message.lastOwned! > Networked.lastOwned[eid]) {
    return true;
  }

  return (
    message.lastOwned === Networked.lastOwned[eid] &&
    message.senderId > Networked.ownerId[eid]
  );
}

export function takeOwnership(world: World, eid: number) {
  Networked.ownerId[eid] = world.localUserParticipantId;
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
  Networked.ownerId[eid] = world.localUserParticipantId;
}

export interface ParticipantChannel {
  participantId: number;
  userId: string;
  datachannel: RTCDataChannel;
  firstSync: boolean;
}

export interface NetworkTemplate {
  onCreate: (
    world: World,
    senderId: number,
    entityId: number,
    networkId: number,
    data: any
  ) => void;
  onUpdate: (
    world: World,
    senderId: number,
    entityId: number,
    networkId: number,
    data: any
  ) => void;
  onDelete: (
    world: World,
    senderId: number,
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
    localUserId,
    networkTickInterval,
  }: { localUserId: string; networkTickInterval: number }
) {
  world.participantChannels = [];
  const inboundNetworkMessages: NetworkMessage[] = [];
  let lastNetworkTick = 0;

  world.networkTemplates = [];
  world.networkTemplateIds = new Map();
  world.networkIdToEntity = new Map();
  world.localUserParticipantId = nextParticipantId++;
  world.userIdToParticipantId = new Map([
    [localUserId, world.localUserParticipantId],
  ]);
  world.participantIdToUserId = new Map([
    [world.localUserParticipantId, localUserId],
  ]);

  function onAddParticipant(userId: string, datachannel: RTCDataChannel) {
    let participantChannel: ParticipantChannel;
    let participantId: number;

    function onDatachannelOpen() {
      participantId = nextParticipantId++;
      participantChannel = {
        participantId,
        userId,
        datachannel,
        firstSync: true,
      };
      world.participantChannels.push(participantChannel);
      world.userIdToParticipantId.set(userId, participantId);
      world.participantIdToUserId.set(participantId, userId);
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
        senderId: participantId,
        networkId,
        templateId,
        data,
        lastOwned,
      });
    });

    datachannel.addEventListener("close", () => {
      const index = world.participantChannels.indexOf(participantChannel);

      if (index !== -1) {
        world.participantChannels.splice(index, 1);
      }

      world.userIdToParticipantId.delete(userId);
      world.participantIdToUserId.delete(participantId);
    });
  }

  function onRemoveParticipant(userId: string) {
    const index = world.participantChannels.findIndex(
      (participantChannel) => participantChannel.userId === userId
    );

    if (index !== -1) {
      world.participantChannels.splice(index, 1);
    }

    const participantId = world.userIdToParticipantId.get(userId);
    world.userIdToParticipantId.delete(userId);
    world.participantIdToUserId.delete(participantId!);
  }

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
        Networked.ownerId[eid] = message.senderId;
        const template = world.networkTemplates[message.templateId!];
        world.networkIdToEntity.set(message.networkId, eid);

        template.onCreate(
          world,
          message.senderId,
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
          message.senderId,
          entityId,
          message.networkId,
          message.data
        );
      } else if (message.type === NetworkMessageType.Delete) {
        const entityId = world.networkIdToEntity.get(message.networkId)!;
        const templateId = Networked.templateId[entityId];
        const template = world.networkTemplates[templateId];

        template.onDelete(world, message.senderId, entityId, message.networkId);
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

    for (let i = 0; i < world.participantChannels.length; i++) {
      world.participantChannels[i].datachannel.send(createPayload);
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

    for (let i = 0; i < world.participantChannels.length; i++) {
      const participantChannel = world.participantChannels[i];

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

    for (let i = 0; i < world.participantChannels.length; i++) {
      world.participantChannels[i].datachannel.send(deletePayload);
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

      for (let i = 0; i < world.participantChannels.length; i++) {
        world.participantChannels[i].firstSync = false;
      }

      lastNetworkTick = now;
    }

    return world;
  };

  const dispose = () => {
    for (const { datachannel } of world.participantChannels) {
      datachannel.close();
    }

    world.participantChannels.length = 0;
  };

  return {
    ReceiveMessagesSystem,
    SendMessagesSystem,
    dispose,
    onAddParticipant,
    onRemoveParticipant,
  };
}
