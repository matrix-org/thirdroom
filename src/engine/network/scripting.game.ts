import { addComponent, hasComponent } from "bitecs";

import {
  CursorView,
  moveCursorView,
  readArrayBuffer,
  readUint8,
  sliceCursorView,
  writeInt32,
  writeUint8,
  writeUint8Array,
} from "../allocator/CursorView";
import { GameState, NetworkMessageItem } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { GameNetworkState, NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { writeUint32, readUint32 } from "../allocator/CursorView";
import {
  getScriptResource,
  readExtensionsAndExtras,
  readUint8Array,
  WASMModuleContext,
  writeArrayBuffer,
  writeFloat32Array,
} from "../scripting/WASMModuleContext";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import { ScriptComponent, scriptQuery } from "../scripting/scripting.game";
import { defineReplicator } from "./NetworkReplicator";
import { Networked } from "./NetworkComponents";
import { addPrefabComponent } from "../prefab/prefab.game";
import { BROADCAST_PEER_ID, enqueueNetworkMessage } from "./NetworkRingBuffer";

export const WebSGNetworkModule = defineModule<GameState, {}>({
  name: "WebSGNetwork",
  create: () => {
    return {};
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);
    network.messageHandlers.set(NetworkAction.ScriptMessage, onScriptMessage);
  },
});

export function createWebSGNetworkModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const network = getModule(ctx, NetworkModule);

  const networkWASMModule = {
    network_get_host_peer_id() {
      return network.hostPeerId;
    },
    network_get_local_peer_id() {
      return network.localPeerId;
    },
    network_broadcast: (packetPtr: number, byteLength: number, binary: number, reliable: number) => {
      try {
        const cursorView = network.outgoingRingBuffer.cursorView;
        moveCursorView(cursorView, 0);
        writeUint8(cursorView, binary !== 0 ? 1 : 0);
        writeUint32(cursorView, byteLength);
        writeUint8Array(cursorView, readUint8Array(wasmCtx, packetPtr, byteLength));
        const message = sliceCursorView(cursorView);
        enqueueNetworkMessage(network.outgoingRingBuffer, reliable !== 0, BROADCAST_PEER_ID, message);
        return 0;
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
        writeUint32(wasmCtx.cursorView, 0);
        writeUint32(wasmCtx.cursorView, 0);
        writeInt32(wasmCtx.cursorView, 0);
        console.error(`WebSGNetworking: Listener ${listenerId} does not exist.`);
        return -1;
      }

      let message: NetworkMessageItem | undefined;
      let peerId: number | undefined;

      while (listener.inbound.length > 0) {
        message = listener.inbound[0];
        peerId = message[0];

        if (!network.connectedPeers.includes(peerId)) {
          // This message is from a peer that no longer exists.
          console.warn("Discarded message from peer that no longer exists");
          listener.inbound.shift();
          message = undefined;
        } else {
          break;
        }
      }

      moveCursorView(wasmCtx.cursorView, infoPtr);
      writeUint32(wasmCtx.cursorView, peerId || 0);
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

        let message: NetworkMessageItem | undefined;

        while (listener.inbound.length > 0) {
          message = listener.inbound.shift();

          if (!message) {
            break;
          }

          const peerId = message[0];

          if (!network.connectedPeers.includes(peerId)) {
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
    peer_get_translation_element(peerIndex: number, index: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return node.position[index];
    },
    peer_get_translation(peerIndex: number, translationPtr: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      writeFloat32Array(wasmCtx, translationPtr, node.position);

      return 0;
    },
    peer_get_rotation_element(peerIndex: number, index: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return node.quaternion[index];
    },
    peer_get_rotation(peerId: number, rotationPtr: number) {
      const node = getPeerNode(ctx, network, peerId);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerId} does not exist.`);
        return -1;
      }

      writeFloat32Array(wasmCtx, rotationPtr, node.quaternion);

      return 0;
    },
    peer_is_host(peerId: number) {
      return network.hostPeerId === peerId ? 1 : 0;
    },
    peer_is_local(peerId: number) {
      return network.localPeerId === peerId ? 1 : 0;
    },
    peer_send: (peerId: number, packetPtr: number, byteLength: number, binary: number, reliable: number) => {
      try {
        if (!network.connectedPeers.includes(peerId)) {
          console.error(`WebSGNetworking: Peer ${peerId} does not exist.`);
          return -1;
        }

        const cursorView = network.outgoingRingBuffer.cursorView;
        moveCursorView(cursorView, 0);
        writeUint8(cursorView, binary !== 0 ? 1 : 0);
        writeUint32(cursorView, byteLength);
        writeUint8Array(cursorView, readUint8Array(wasmCtx, packetPtr, byteLength));
        const message = sliceCursorView(cursorView);
        enqueueNetworkMessage(network.outgoingRingBuffer, reliable !== 0, peerId, message);
      } catch (error) {
        console.error("WebSGNetworking: Error broadcasting packet:", error);
        return -1;
      }
    },
    define_replicator: () => {
      const replicator = defineReplicator(ctx);
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

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        console.error("Undefined node.");
        return -1;
      }

      const buffer = new Uint8Array([...readUint8Array(wasmCtx, packetPtr, byteLength)]);
      const data = byteLength > 0 ? buffer : undefined;

      replicator.spawnExisting(node, data);

      return 0;
    },
    replicator_despawn_local: (replicatorId: number, nodeId: number) => {
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

      replicator.despawn(nodeId);

      return 0;
    },
    replicator_get_spawned_message_info: (replicatorId: number, infoPtr: number) => {
      try {
        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          moveCursorView(wasmCtx.cursorView, infoPtr);
          writeUint32(wasmCtx.cursorView, 0);
          writeUint32(wasmCtx.cursorView, 0);
          writeUint32(wasmCtx.cursorView, 0);
          writeUint32(wasmCtx.cursorView, 0);
          console.error("Undefined replicator.");
          return -1;
        }

        if (replicator.spawned.length === 0) {
          return 0;
        }

        const replication = replicator.spawned[0];
        const nodeId = replication?.nodeId || 0;
        const networkId = replication?.networkId || 0;
        const byteLength = replication?.data?.byteLength || 0;

        moveCursorView(wasmCtx.cursorView, infoPtr);
        writeUint32(wasmCtx.cursorView, nodeId);
        writeUint32(wasmCtx.cursorView, networkId);
        writeUint32(wasmCtx.cursorView, byteLength);

        return replicator.spawned.length;
      } catch (e) {
        console.error("Error getting replicator spawned message info:", e);
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

        const replication = replicator.spawned.shift();

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
      const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

      if (!replicator) {
        console.error(`WebSGNetworking: replicator ${replicatorId} does not exist or has been closed.`);
        return -1;
      }

      const nodeId = replicator.despawned.shift();

      return nodeId || 0;
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
        const networkId = readUint32(wasmCtx.cursorView);
        const replicatorId = readUint32(wasmCtx.cursorView);

        const replicator = wasmCtx.resourceManager.replicators.get(replicatorId);

        if (!replicator) {
          console.error(`WebSGNetworking: replicator ${replicatorId} does not exist or has been closed.`);
          return -1;
        }

        addComponent(ctx.world, Networked, nodeId, true);
        Networked.networkId[nodeId] = networkId;
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

function onScriptMessage(ctx: GameState, from: number, cursorView: CursorView) {
  const binary = readUint8(cursorView) === 1;
  const byteLength = readUint32(cursorView);
  const data = readArrayBuffer(cursorView, byteLength);

  const message: [number, ArrayBuffer, boolean] = [from, data, binary];

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

function getPeerNode(ctx: GameState, network: GameNetworkState, peerIndex: number) {
  const peerId = network.indexToPeerId.get(peerIndex);

  if (!peerId) {
    return undefined;
  }

  const eid = network.peerIdToEntityId.get(peerId);

  if (!eid) {
    return undefined;
  }

  return getRemoteResource<RemoteNode>(ctx, eid);
}
