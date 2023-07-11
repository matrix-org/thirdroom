import { addComponent, hasComponent } from "bitecs";

import {
  createCursorView,
  moveCursorView,
  readArrayBuffer,
  sliceCursorView,
  writeArrayBuffer as cursorWriteArrayBuffer,
  writeInt32,
  CursorView,
  writeUint64,
  readUint64,
} from "../allocator/CursorView";
import { GameContext } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { GameNetworkState, NetworkModule, PeerID, getPeerId, tryGetPeerInfoById } from "./network.game";
import { NetworkMessage } from "./NetworkMessage";
import { writeMessageType } from "./serialization.game";
import { writeUint32, readUint32 } from "../allocator/CursorView";
import { registerInboundMessageHandler } from "./InboundNetworkSystem";
import {
  getScriptResource,
  readExtensionsAndExtras,
  readUint8Array,
  WASMModuleContext,
  writeArrayBuffer,
  writeFloat32Array,
  writeString,
} from "../scripting/WASMModuleContext";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import { createDisposables } from "../utils/createDisposables";
import { NetworkMessageType, PeerEnteredMessage, PeerExitedMessage } from "./network.common";
import { ScriptComponent, scriptQuery } from "../scripting/scripting.game";
import { Replication, createReplicator } from "./Replicator";
import { Networked, Authoring } from "./NetworkComponents";
import { addPrefabComponent } from "../prefab/prefab.game";
import { enqueueReliableBroadcast, enqueueReliable, enqueueUnreliable } from "./NetworkRingBuffer";

export const WebSGNetworkModule = defineModule<GameContext, {}>({
  name: "WebSGNetwork",
  create: () => {
    return {};
  },
  init(ctx: GameContext) {
    const network = getModule(ctx, NetworkModule);
    registerInboundMessageHandler(network, NetworkMessage.BinaryScriptMessage, (ctx, v, peerId) =>
      deserializeScriptMessage(ctx, v, peerId, true)
    );
    registerInboundMessageHandler(network, NetworkMessage.StringScriptMessage, (ctx, v, peerId) =>
      deserializeScriptMessage(ctx, v, peerId, true)
    );

    return createDisposables([
      registerMessageHandler(ctx, NetworkMessageType.PeerEntered, onPeerEntered),
      registerMessageHandler(ctx, NetworkMessageType.PeerExited, onPeerExited),
    ]);
  },
});

function onPeerEntered(ctx: GameContext, msg: PeerEnteredMessage) {
  const entities = scriptQuery(ctx.world);

  for (const eid of entities) {
    const script = ScriptComponent.get(eid);
    script?.peerEntered(msg.peerIndex);
  }
}

function onPeerExited(ctx: GameContext, msg: PeerExitedMessage) {
  const entities = scriptQuery(ctx.world);

  for (const eid of entities) {
    const script = ScriptComponent.get(eid);
    script?.peerExited(msg.peerIndex);
  }
}

export function createWebSGNetworkModule(ctx: GameContext, wasmCtx: WASMModuleContext) {
  const network = getModule(ctx, NetworkModule);

  const networkWASMModule = {
    network_get_host_peer_index() {
      const peerId = network.host?.id;

      if (peerId === undefined) {
        return 0n;
      }

      return peerId;
    },
    network_get_local_peer_index() {
      const peerId = network.local?.id;

      if (peerId === undefined) {
        return 0n;
      }

      return peerId;
    },
    network_broadcast: (packetPtr: number, byteLength: number, binary: number, reliable: number) => {
      try {
        const scriptPacket = readUint8Array(wasmCtx, packetPtr, byteLength);

        const msg = createScriptMessage(ctx, scriptPacket, !!binary);

        if (reliable) {
          enqueueReliableBroadcast(network, msg);
          return 0;
        } else {
          console.error("WebSGNetworking: Unreliable broadcast currently not supported.");
          return -1;
        }
      } catch (error) {
        console.error("WebSGNetworking: Error broadcasting packet:", error);
        return -1;
      }
    },
    network_listen() {
      const id = wasmCtx.resourceManager.nextNetworkListenerId++;

      wasmCtx.resourceManager.networkListeners.push({
        id,
        inbound: [],
      });

      return id;
    },
    network_listener_close(listenerId: number) {
      const networkListeners = wasmCtx.resourceManager.networkListeners;
      const index = networkListeners.findIndex((l) => l.id === listenerId);

      if (index === -1) {
        console.error(`WebSGNetworking: Listener ${listenerId} does not exist.`);
        return -1;
      }

      networkListeners.splice(index, 1);

      return 0;
    },
    network_listener_get_message_info(listenerId: number, infoPtr: number) {
      const listener = wasmCtx.resourceManager.networkListeners.find((l) => l.id === listenerId);

      if (!listener) {
        moveCursorView(wasmCtx.cursorView, infoPtr);
        writeUint64(wasmCtx.cursorView, 0n);
        writeUint32(wasmCtx.cursorView, 0);
        writeInt32(wasmCtx.cursorView, 0);
        console.error(`WebSGNetworking: Listener ${listenerId} does not exist.`);
        return -1;
      }

      let message: [string, ArrayBuffer, boolean] | undefined;
      let peerIndex: PeerID | undefined;

      while (listener.inbound.length > 0) {
        message = listener.inbound[0];
        const peerId = message[0];
        peerIndex = getPeerId(network, peerId);

        if (peerIndex === undefined) {
          // This message is from a peer that no longer exists.
          console.warn("Discarded message from peer that no longer exists");
          listener.inbound.shift();
          message = undefined;
        } else {
          break;
        }
      }

      moveCursorView(wasmCtx.cursorView, infoPtr);
      writeUint64(wasmCtx.cursorView, peerIndex || 0n);
      writeUint32(wasmCtx.cursorView, message ? message[1].byteLength : 0);
      writeInt32(wasmCtx.cursorView, message ? (message[2] ? 1 : 0) : 0);

      return listener.inbound.length;
    },
    network_listener_receive: (listenerId: number, packetPtr: number, maxBufLength: number) => {
      try {
        const listener = wasmCtx.resourceManager.networkListeners.find((l) => l.id === listenerId);

        if (!listener) {
          console.error(`WebSGNetworking: Listener ${listenerId} does not exist or has been closed.`);
          return -1;
        }

        let message: [string, ArrayBuffer, boolean] | undefined;

        while (listener.inbound.length > 0) {
          message = listener.inbound.shift();

          if (!message) {
            break;
          }

          const peerId = message[0];
          const peerIndex = getPeerId(network, peerId);

          if (peerIndex === undefined) {
            console.warn("Discarded message from peer that no longer exists");
            // This message is from a peer that no longer exists.
            message = undefined;
          } else {
            break;
          }
        }

        if (!message) {
          return 0;
        }

        const buffer = message[1];

        if (buffer.byteLength > maxBufLength) {
          console.error("Failed to receive script packet, packet length exceeded buffer length");
          return -1;
        }

        return writeArrayBuffer(wasmCtx, packetPtr, buffer);
      } catch (e) {
        console.error("Error writing packet to write buffer:", e);
        return -1;
      }
    },
    peer_get_id_length(peerId: PeerID) {
      const peerInfo = tryGetPeerInfoById(network, peerId);
      const peerKey = peerInfo.key;

      if (!peerKey) {
        console.error(`WebSGNetworking: PeerId ${peerId} does not exist.`);
        return -1;
      }

      return peerKey.length;
    },
    peer_get_id(peerId: PeerID, idPtr: number, maxBufLength: number) {
      const peerInfo = tryGetPeerInfoById(network, peerId);
      const peerKey = peerInfo.key;

      if (!peerKey) {
        console.error(`WebSGNetworking: Peer ${peerId} does not exist.`);
        return -1;
      }

      try {
        return writeString(wasmCtx, idPtr, peerKey, maxBufLength);
      } catch (error) {
        console.error(error);
        return -1;
      }
    },
    peer_get_translation_element(peerIndex: PeerID, index: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return node.position[index];
    },
    peer_get_translation(peerIndex: PeerID, translationPtr: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      writeFloat32Array(wasmCtx, translationPtr, node.position);

      return 0;
    },
    peer_get_rotation_element(peerIndex: PeerID, index: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return node.quaternion[index];
    },
    peer_get_rotation(peerIndex: PeerID, rotationPtr: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      writeFloat32Array(wasmCtx, rotationPtr, node.quaternion);

      return 0;
    },
    peer_is_host(peerId: PeerID) {
      const peerInfo = tryGetPeerInfoById(network, peerId);
      return network.host === peerInfo ? 1 : 0;
    },
    peer_is_local(peerId: PeerID) {
      const peerInfo = tryGetPeerInfoById(network, peerId);
      return network.local === peerInfo ? 1 : 0;
    },
    peer_send: (peerId: PeerID, packetPtr: number, byteLength: number, binary: number, reliable: number) => {
      try {
        const peerInfo = tryGetPeerInfoById(network, peerId);
        const peerKey = peerInfo.key;

        if (!peerKey) {
          console.error(`WebSGNetworking: PeerId ${peerId} does not exist.`);
          return -1;
        }

        const scriptPacket = readUint8Array(wasmCtx, packetPtr, byteLength);

        const msg = createScriptMessage(ctx, scriptPacket, !!binary);

        if (reliable) {
          enqueueReliable(network, peerKey, msg);
          return 0;
        } else {
          enqueueUnreliable(network, peerKey, msg);
        }
      } catch (error) {
        console.error("WebSGNetworking: Error broadcasting packet:", error);
        return -1;
      }
    },
    define_replicator: () => {
      const replicator = createReplicator(network, wasmCtx.resourceManager);
      return replicator.id;
    },
    replicator_spawned_count: (replicatorId: number) => {
      const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

      if (!replicator) {
        console.error("Undefined replicator.");
        return -1;
      }

      return replicator.spawned.length;
    },
    replicator_despawned_count: (replicatorId: number) => {
      const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

      if (!replicator) {
        console.error("Undefined replicator.");
        return -1;
      }

      return replicator.despawned.length;
    },
    replicator_spawn_local: (replicatorId: number, nodeId: number, packetPtr: number, byteLength: number) => {
      const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

      if (!replicator) {
        console.error("Undefined replicator.");
        return -1;
      }

      addPrefabComponent(ctx.world, nodeId, replicator.prefabName);
      addComponent(ctx.world, Networked, nodeId);
      addComponent(ctx.world, Authoring, nodeId);

      const buffer = new Uint8Array([...readUint8Array(wasmCtx, packetPtr, byteLength)]);
      const data = byteLength > 0 ? buffer : undefined;

      if (data) {
        replicator.eidToData.set(nodeId, data);
      }

      replicator.spawned.push({ nodeId, peerIndex: network.local!.id!, data });

      return 0;
    },
    replicator_despawn_local: (replicatorId: number, nodeId: number, packetPtr: number, byteLength: number) => {
      const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

      if (!replicator) {
        console.error("Undefined replicator.");
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      if (!node) {
        console.error("Undefined node.");
        return -1;
      }

      const buffer = new Uint8Array([...readUint8Array(wasmCtx, packetPtr, byteLength)]);
      const data = byteLength > 0 ? buffer : undefined;

      if (data) {
        replicator.eidToData.set(nodeId, data);
      }

      replicator.despawned.push({ nodeId, peerIndex: network.local!.id!, data });

      return 0;
    },
    replicator_get_spawned_message_info: (replicatorId: number, infoPtr: number) => {
      try {
        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          moveCursorView(wasmCtx.cursorView, infoPtr);
          writeUint32(wasmCtx.cursorView, 0);
          writeUint64(wasmCtx.cursorView, 0n);
          writeUint64(wasmCtx.cursorView, 0n);
          writeUint32(wasmCtx.cursorView, 0);
          console.error("Undefined replicator.");
          return -1;
        }

        let replication: Replication | undefined;

        while (replicator.spawned.length > 0) {
          replication = replicator.spawned[0];

          if (replication.peerIndex === undefined) {
            console.warn("Discarded replication from peer that no longer exists");
            replicator.spawned.shift();
            replication = undefined;
          } else {
            break;
          }
        }

        const nodeId = replication?.nodeId || 0;
        const networkId = replication?.networkId || 0;
        const peerIndex = replication?.peerIndex || 0;
        const byteLength = replication?.data?.byteLength || 0;

        moveCursorView(wasmCtx.cursorView, infoPtr);
        writeUint32(wasmCtx.cursorView, nodeId);
        writeUint64(wasmCtx.cursorView, BigInt(networkId));
        writeUint64(wasmCtx.cursorView, BigInt(peerIndex));
        writeUint32(wasmCtx.cursorView, byteLength);

        return replicator.spawned.length;
      } catch (e) {
        console.error("Error getting replicator spawned message info:", e);
        return -1;
      }
    },
    replicator_get_despawned_message_info: (replicatorId: number, infoPtr: number) => {
      try {
        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          moveCursorView(wasmCtx.cursorView, infoPtr);
          writeUint32(wasmCtx.cursorView, 0);
          writeUint64(wasmCtx.cursorView, 0n);
          writeUint64(wasmCtx.cursorView, 0n);
          writeUint32(wasmCtx.cursorView, 0);
          console.error("Undefined replicator.");
          return -1;
        }

        let replication: Replication | undefined;

        while (replicator.despawned.length > 0) {
          replication = replicator.despawned[0];

          if (replication.peerIndex === undefined) {
            console.warn("Discarded replication from peer that no longer exists");
            replicator.despawned.shift();
            replication = undefined;
          } else {
            break;
          }
        }

        const nodeId = replication?.nodeId || 0;
        const networkId = replication?.networkId || 0;
        const peerIndex = replication?.peerIndex || 0;
        const byteLength = replication?.data?.byteLength || 0;

        moveCursorView(wasmCtx.cursorView, infoPtr);
        writeUint32(wasmCtx.cursorView, nodeId);
        writeUint64(wasmCtx.cursorView, BigInt(networkId));
        writeUint64(wasmCtx.cursorView, BigInt(peerIndex));
        writeUint32(wasmCtx.cursorView, byteLength);

        return replicator.despawned.length;
      } catch (e) {
        console.error("Error getting replicator despawned message info:", e);
        return -1;
      }
    },
    replicator_spawn_receive: (replicatorId: number, packetPtr: number, maxBufLength: number) => {
      try {
        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          console.error(`WebSGNetworking: replicator ${replicatorId} does not exist or has been closed.`);
          return -1;
        }

        let replication: Replication | undefined;

        while (replicator.spawned.length > 0) {
          replication = replicator.spawned.shift();

          if (!replication) {
            break;
          }

          if (replication.peerIndex === undefined) {
            console.warn("Discarded replication from peer that no longer exists");
            // This message is from a peer that no longer exists.
            replication = undefined;
          } else {
            break;
          }
        }

        if (!replication) {
          return 0;
        }

        if (!replication.data || replication.data.byteLength === 0) {
          return 0;
        }

        if (replication.data.byteLength > maxBufLength) {
          console.error("Failed to receive replication, length exceeded buffer length");
          return -1;
        }

        return writeArrayBuffer(wasmCtx, packetPtr, replication.data);
      } catch (e) {
        console.error("Error writing packet to write buffer:", e);
        return -1;
      }
    },
    replicator_despawn_receive: (replicatorId: number, packetPtr: number, maxBufLength: number) => {
      try {
        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          console.error(`WebSGNetworking: replicator ${replicatorId} does not exist or has been closed.`);
          return -1;
        }

        let replication: Replication | undefined;

        while (replicator.despawned.length > 0) {
          replication = replicator.despawned.shift();

          if (!replication) {
            break;
          }

          if (replication.peerIndex === undefined) {
            console.warn("Discarded replication from peer that no longer exists");
            // This message is from a peer that no longer exists.
            replication = undefined;
          } else {
            break;
          }
        }

        if (!replication || !replication.data || replication.data.byteLength === 0) {
          return 0;
        }

        const byteLength = replication.data?.byteLength || 0;

        if (byteLength > maxBufLength) {
          console.error("Failed to receive replication, length exceeded buffer length");
          return -1;
        }

        return writeArrayBuffer(wasmCtx, packetPtr, replication.data || new ArrayBuffer(0));
      } catch (e) {
        console.error("Error writing packet to write buffer:", e);
        return -1;
      }
    },
    node_add_network_synchronizer: (nodeId: number, propsPtr: number) => {
      try {
        const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

        if (!node) {
          return -1;
        }

        if (hasComponent(ctx.world, Networked, nodeId)) {
          console.error("WebSGNetworking: node already has network synchronizer.");
          return -1;
        }

        moveCursorView(wasmCtx.cursorView, propsPtr);
        readExtensionsAndExtras(wasmCtx);
        const networkId = readUint64(wasmCtx.cursorView);
        const replicatorId = readUint32(wasmCtx.cursorView);

        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          console.error(`WebSGNetworking: replicator ${replicatorId} does not exist or has been closed.`);
          return -1;
        }

        addComponent(ctx.world, Networked, nodeId, true);
        Networked.networkId[nodeId] = Number(networkId);
        network.networkIdToEntityId.set(networkId, nodeId);
        addPrefabComponent(ctx.world, nodeId, replicator.prefabName);

        const deferredUpdates = network.deferredUpdates.get(networkId);

        if (deferredUpdates) {
          for (let i = 0; i < deferredUpdates.length; i++) {
            const { position, quaternion } = deferredUpdates[i];
            // set the networked component state for networked objects
            Networked.position[node.eid].set(position);
            Networked.quaternion[node.eid].set(quaternion);
          }

          network.deferredUpdates.delete(networkId);
        }

        return 0;
      } catch (error) {
        console.error(`WebSG: error adding interactable:`, error);
        return -1;
      }
    },
  };

  const disposeNetworkModule = () => {
    wasmCtx.resourceManager.networkListeners.length = 0;
    wasmCtx.resourceManager.nextNetworkListenerId = 1;
    wasmCtx.resourceManager.replicators.clear();
    wasmCtx.resourceManager.nextReplicatorId = 1;
  };

  return [networkWASMModule, disposeNetworkModule] as const;
}

const messageView = createCursorView(new ArrayBuffer(10000));

function createScriptMessage(ctx: GameContext, packet: ArrayBuffer, binary: boolean) {
  writeMessageType(messageView, binary ? NetworkMessage.BinaryScriptMessage : NetworkMessage.StringScriptMessage);
  serializeScriptMessage(messageView, packet);
  return sliceCursorView(messageView);
}

function serializeScriptMessage(v: CursorView, packet: ArrayBuffer) {
  writeUint32(v, packet.byteLength);
  cursorWriteArrayBuffer(v, packet);
}

function deserializeScriptMessage(ctx: GameContext, v: CursorView, peerId: string, binary: boolean) {
  const len = readUint32(v);
  const packet = readArrayBuffer(v, len);

  const message: [string, ArrayBuffer, boolean] = [peerId, packet, binary];

  const scripts = scriptQuery(ctx.world);

  for (let i = 0; i < scripts.length; i++) {
    const script = ScriptComponent.get(scripts[i]);

    if (!script) {
      continue;
    }

    const resourceManager = script.wasmCtx.resourceManager;

    if (resourceManager.networkListeners.length === 0) {
      return;
    }

    for (let i = 0; i < resourceManager.networkListeners.length; i++) {
      const listener = resourceManager.networkListeners[i];
      listener.inbound.push(message);
    }
  }
}

function getPeerNode(ctx: GameContext, network: GameNetworkState, peerId: PeerID) {
  const peerInfo = tryGetPeerInfoById(network, peerId);
  const peerKey = peerInfo.key;

  if (!peerKey) {
    return undefined;
  }

  const eid = peerInfo.entityId;

  if (!eid) {
    return undefined;
  }

  return getRemoteResource<RemoteNode>(ctx, eid);
}
