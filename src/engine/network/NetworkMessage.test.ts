import { assert } from "vitest";

import {
  readDespawn,
  readPeerInfo,
  readSpawn,
  readTransform,
  writeDespawn,
  writePeerInfo,
  writeSpawn,
  writeTransform,
} from "./NetworkMessage";
import { RemoteNode, RemotePhysicsBody } from "../resource/RemoteResources";
import { CursorView, createCursorView, moveCursorView } from "../allocator/CursorView";
import { NetworkID, NetworkModule, PeerIndex, tryGetPeerIndex } from "./network.game";
import { NetworkReplicator, createNetworkReplicator } from "./NetworkReplicator";
import { mockGameState } from "../../../test/engine/mocks";
import { getModule } from "../module/module.common";
import { Codec } from "./Codec";
import { Networked } from "./NetworkComponents";

const transformCodec: Codec<RemoteNode> = {
  encode: (view: CursorView, node: RemoteNode) => {
    return writeTransform(view, node);
  },
  decode: (view: CursorView, node: RemoteNode) => {
    return readTransform(view, node);
  },
};

describe("Network Message Tests", () => {
  test("writeTransform and readTransform", () => {
    const ctx = mockGameState();

    const mockNode = new RemoteNode(ctx.resourceManager, {
      position: [1, 2, 3],
      quaternion: [7, 8, 9, 10],
    });
    mockNode.physicsBody = new RemotePhysicsBody(ctx.resourceManager);
    mockNode.physicsBody.velocity = new Float32Array([4, 5, 6]);

    const v = createCursorView();

    const writtenBytes = writeTransform(v, mockNode);

    const newNode = new RemoteNode(ctx.resourceManager);
    newNode.physicsBody = new RemotePhysicsBody(ctx.resourceManager);
    newNode.physicsBody.velocity = new Float32Array([0, 0, 0]);

    moveCursorView(v, 0);
    readTransform(v, newNode);

    assert.deepEqual(writtenBytes, 10 * Float32Array.BYTES_PER_ELEMENT);
    assert.deepEqual(newNode.position, mockNode.position);
    assert.deepEqual(newNode.physicsBody!.velocity, mockNode.physicsBody!.velocity);
    assert.deepEqual(newNode.quaternion, mockNode.quaternion);
  });

  test("writePeerInfo and readPeerInfo", () => {
    const ctx = mockGameState();
    const network = getModule(ctx, NetworkModule);

    const v = createCursorView();

    const mockPeerId = "testPeerId";
    const mockPeerIndex = 1n;

    writePeerInfo(v, mockPeerId, mockPeerIndex);

    moveCursorView(v, 0);
    readPeerInfo(network, v);

    assert.deepEqual(tryGetPeerIndex(network, mockPeerId), mockPeerIndex);
  });

  test("writeSpawn and readSpawn", () => {
    const ctx = mockGameState();
    const network = getModule(ctx, NetworkModule);

    const replicator: NetworkReplicator<RemoteNode> = createNetworkReplicator(
      ctx,
      () => {
        const node = new RemoteNode(ctx.resourceManager);
        node.physicsBody = new RemotePhysicsBody(ctx.resourceManager);
        node.physicsBody.velocity = new Float32Array();
        return node;
      },
      transformCodec
    );

    const mockNetworkId: NetworkID = 1n;
    const mockAuthorIndex: PeerIndex = 1n;
    const mockData = new Uint8Array([1, 2, 3, 4]).buffer;
    const mockNode = replicator.spawn(ctx);

    const v: CursorView = createCursorView();

    writeSpawn(v, mockNetworkId, mockAuthorIndex, replicator, mockNode, mockData);

    moveCursorView(v, 0);
    readSpawn(ctx, network, v);

    assert.ok(network.networkIdToEntityId.has(mockNetworkId));
    assert.ok(replicator.spawned.some((spawn) => spawn.node === mockNode));
  });

  test("writeDespawn and readDespawn", () => {
    const ctx = mockGameState();
    const network = getModule(ctx, NetworkModule);

    const replicator: NetworkReplicator<RemoteNode> = createNetworkReplicator(
      ctx,
      () => new RemoteNode(ctx.resourceManager),
      transformCodec
    );

    const mockNode = replicator.factory(ctx);
    const eid = mockNode.eid;
    const nid = BigInt(eid);

    network.networkIdToEntityId.set(nid, eid);
    Networked.replicatorId[eid] = replicator.id;

    const v: CursorView = createCursorView();

    writeDespawn(v, nid);

    moveCursorView(v, 0);
    readDespawn(ctx, network, v);

    assert.ok(replicator.despawned.some((despawn) => despawn === mockNode));
  });
});
