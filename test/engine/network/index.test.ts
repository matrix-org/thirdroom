// import { describe, it } from "vitest";
import { ok, strictEqual } from "assert";
import { addComponent, addEntity, createWorld, entityExists, removeComponent } from "bitecs";

import { Transform } from "../../../src/engine/component/transform";
import { GameState } from "../../../src/engine/GameWorker";
import {
  createNetworkId,
  deserializeCreates,
  deserializeDeletes,
  deserializeTransformChanged,
  deserializeUpdatesChanged,
  getPeerIdFromNetworkId,
  getLocalIdFromNetworkId,
  remoteNetworkedQuery,
  Owned,
  Networked,
  ownedNetworkedQuery,
  serializeCreates,
  serializeDeletes,
  serializeTransformChanged,
  serializeUpdatesChanged,
  serializeTransformSnapshot,
  deserializeTransformSnapshot,
  serializeUpdatesSnapshot,
  deserializeUpdatesSnapshot,
  NetworkModule,
} from "../../../src/engine/network/network.game";
import {
  createCursorView,
  readFloat32,
  readString,
  readUint32,
  readUint8,
} from "../../../src/engine/allocator/CursorView";
import { mockGameState } from "../mocks";
import { getModule } from "../../../src/engine/module/module.common";

describe("Network Tests", () => {
  describe("networkId", () => {
    it("should #getPeerIdFromNetworkId()", () => {
      const nid = 0xfff0_000f;
      strictEqual(getPeerIdFromNetworkId(nid), 0x000f);
    });
    it("should #getLocalIdFromNetworkId()", () => {
      const nid = 0xfff0_000f;
      strictEqual(getLocalIdFromNetworkId(nid), 0xfff0);
    });
    // hack - remove for id layer
    it.skip("should #createNetworkId", () => {
      const state = {
        network: {
          peerId: "abc",
          peerIdToIndex: new Map([["abc", 0x00ff]]),
          localIdCount: 0x000f,
          removedLocalIds: [],
        },
      } as unknown as GameState;
      const nid = createNetworkId(state);
      strictEqual(nid, 0x000f_00ff);
    });
  });
  describe("tranform serialization", () => {
    it("should #serializeTransformSnapshot()", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      position.set([1, 2, 3]);
      quaternion.set([4, 5, 6]);

      serializeTransformSnapshot(writer, eid);

      const reader = createCursorView(writer.buffer);

      const posX = readFloat32(reader);
      strictEqual(posX, 1);

      const posY = readFloat32(reader);
      strictEqual(posY, 2);

      const posZ = readFloat32(reader);
      strictEqual(posZ, 3);

      const rotX = readFloat32(reader);
      strictEqual(rotX, 4);

      const rotY = readFloat32(reader);
      strictEqual(rotY, 5);

      const rotZ = readFloat32(reader);
      strictEqual(rotZ, 6);
    });
    it("should #deserializeTransformSnapshot()", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      position.set([1, 2, 3]);
      quaternion.set([4, 5, 6]);

      serializeTransformSnapshot(writer, eid);

      position.set([0, 0, 0]);
      quaternion.set([0, 0, 0]);

      const reader = createCursorView(writer.buffer);

      deserializeTransformSnapshot(reader, eid);

      strictEqual(position[0], 1);
      strictEqual(position[1], 2);
      strictEqual(position[2], 3);

      strictEqual(quaternion[0], 4);
      strictEqual(quaternion[1], 5);
      strictEqual(quaternion[2], 6);
    });
    it("should #serializeTransformChanged() with all values", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      position.set([1, 2, 3]);
      quaternion.set([4, 5, 6]);

      serializeTransformChanged(writer, eid);

      const reader = createCursorView(writer.buffer);

      const changeMask = readUint8(reader);
      strictEqual(changeMask, 0b111111);

      const posX = readFloat32(reader);
      strictEqual(posX, 1);

      const posY = readFloat32(reader);
      strictEqual(posY, 2);

      const posZ = readFloat32(reader);
      strictEqual(posZ, 3);

      const rotX = readFloat32(reader);
      strictEqual(rotX, 4);

      const rotY = readFloat32(reader);
      strictEqual(rotY, 5);

      const rotZ = readFloat32(reader);
      strictEqual(rotZ, 6);
    });
    it("should #serializeTransformChanged() with some values", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      position.set([0, 2, 0]);
      quaternion.set([4, 0, 6]);

      serializeTransformChanged(writer, eid);

      const reader = createCursorView(writer.buffer);

      const changeMask = readUint8(reader);
      strictEqual(changeMask, 0b00101010);

      // const posX = readFloat32(reader);
      // strictEqual(posX, 0);

      const posY = readFloat32(reader);
      strictEqual(posY, 2);

      // const posZ = readFloat32(reader);
      // strictEqual(posZ, 0);

      const quatX = readFloat32(reader);
      strictEqual(quatX, 4);

      // const rotY = readFloat32(reader);
      // strictEqual(rotY, 0);

      const quatZ = readFloat32(reader);
      strictEqual(quatZ, 6);
    });
    it("should #deserializeTransformChanged() with all values", () => {
      const writer = createCursorView();
      const eid = 1;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      position.set([1, 2, 3]);
      quaternion.set([4, 5, 6]);

      serializeTransformChanged(writer, eid);

      position.set([0, 0, 0]);
      quaternion.set([0, 0, 0]);

      const reader = createCursorView(writer.buffer);

      deserializeTransformChanged(reader, eid);

      strictEqual(position[0], 1);
      strictEqual(position[1], 2);
      strictEqual(position[2], 3);

      strictEqual(quaternion[0], 4);
      strictEqual(quaternion[1], 5);
      strictEqual(quaternion[2], 6);
      strictEqual(quaternion[3], 0);
    });
    it("should #deserializeTransformChanged() with some values", () => {
      const writer = createCursorView();
      const eid = 1;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      position.set([0, 2, 0]);
      quaternion.set([4, 0, 6]);

      serializeTransformChanged(writer, eid);

      position.set([0, 0, 0]);
      quaternion.set([0, 0, 0]);

      const reader = createCursorView(writer.buffer);

      deserializeTransformChanged(reader, eid);

      strictEqual(position[0], 0);
      strictEqual(position[1], 2);
      strictEqual(position[2], 0);

      strictEqual(quaternion[0], 4);
      strictEqual(quaternion[1], 0);
      strictEqual(quaternion[2], 6);
      strictEqual(quaternion[3], 0);
    });
  });
  describe("updates serialization", () => {
    it("should #serializeUpdatesSnapshot()", () => {
      const state = { world: createWorld() } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Transform, eid);
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        position.set([1, 2, 3]);
        quaternion.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Owned, eid);
      });

      serializeUpdatesSnapshot([state, writer]);

      const reader = createCursorView(writer.buffer);

      const count = readUint32(reader);
      strictEqual(count, 3);

      ents.forEach((eid) => {
        const nid = Networked.networkId[eid];
        strictEqual(nid, readUint32(reader));

        const position = Transform.position[eid];
        strictEqual(position[0], readFloat32(reader));
        strictEqual(position[1], readFloat32(reader));
        strictEqual(position[2], readFloat32(reader));

        const quaternion = Transform.quaternion[eid];
        strictEqual(quaternion[0], readFloat32(reader));
        strictEqual(quaternion[1], readFloat32(reader));
        strictEqual(quaternion[2], readFloat32(reader));
        strictEqual(quaternion[3], readFloat32(reader));
      });
    });
    it("should #deserializeUpdatesSnapshot()", () => {
      const state = mockGameState();
      const network = getModule(state, NetworkModule);
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Transform, eid);
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        position.set([1, 2, 3]);
        quaternion.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        network.networkIdToEntityId.set(eid, eid);
        addComponent(state.world, Owned, eid);
      });

      serializeUpdatesSnapshot([state, writer]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        position.set([0, 0, 0]);
        quaternion.set([0, 0, 0]);
      });

      const reader = createCursorView(writer.buffer);

      deserializeUpdatesSnapshot([state, reader]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        strictEqual(position[0], 1);
        strictEqual(position[1], 2);
        strictEqual(position[2], 3);
        strictEqual(quaternion[0], 4);
        strictEqual(quaternion[1], 5);
        strictEqual(quaternion[2], 6);
        strictEqual(quaternion[3], 0);
      });
    });
    it("should #serializeUpdatesChanged()", () => {
      const state = { world: createWorld() } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Transform, eid);
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        position.set([1, 2, 3]);
        quaternion.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Owned, eid);
      });

      serializeUpdatesChanged([state, writer]);

      const reader = createCursorView(writer.buffer);

      const count = readUint32(reader);
      strictEqual(count, 3);

      ents.forEach((eid) => {
        const nid = Networked.networkId[eid];
        strictEqual(nid, readUint32(reader));

        const changeMask = readUint8(reader);
        strictEqual(changeMask, 0b111111);

        const position = Transform.position[eid];
        strictEqual(position[0], readFloat32(reader));
        strictEqual(position[1], readFloat32(reader));
        strictEqual(position[2], readFloat32(reader));

        const quaternion = Transform.quaternion[eid];
        strictEqual(quaternion[0], readFloat32(reader));
        strictEqual(quaternion[1], readFloat32(reader));
        strictEqual(quaternion[2], readFloat32(reader));
      });
    });
    it("should #deserializeUpdatesChanged()", () => {
      const state = mockGameState();
      const network = getModule(state, NetworkModule);
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Transform, eid);
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        position.set([1, 2, 3]);
        quaternion.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        network.networkIdToEntityId.set(eid, eid);
        addComponent(state.world, Owned, eid);
      });

      serializeUpdatesChanged([state, writer]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        position.set([0, 0, 0]);
        quaternion.set([0, 0, 0]);
      });

      const reader = createCursorView(writer.buffer);

      deserializeUpdatesChanged([state, reader]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        strictEqual(position[0], 1);
        strictEqual(position[1], 2);
        strictEqual(position[2], 3);
        strictEqual(quaternion[0], 4);
        strictEqual(quaternion[1], 5);
        strictEqual(quaternion[2], 6);
      });
    });
  });
  describe("creates serialization", () => {
    it("should #serializeCreates()", () => {
      const state = mockGameState();
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Owned, eid);
      });

      strictEqual(ownedNetworkedQuery(state.world).length, 3);

      serializeCreates([state, writer]);

      const reader = createCursorView(writer.buffer);

      const count = readUint32(reader);
      strictEqual(count, 3);

      ents.forEach((eid) => {
        strictEqual(readUint32(reader), eid);
        strictEqual(readString(reader), "cube");
      });
    });
    it("should #deserializeCreates()", () => {
      const state = mockGameState();
      const network = getModule(state, NetworkModule);

      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Owned, eid);
      });

      const localEntities = ownedNetworkedQuery(state.world);
      strictEqual(localEntities.length, 3);

      serializeCreates([state, writer]);

      const reader = createCursorView(writer.buffer);

      deserializeCreates([state, reader]);

      const remoteEntities = remoteNetworkedQuery(state.world);
      strictEqual(remoteEntities.length, 3);

      for (let i = 0; i < remoteEntities.length; i++) {
        const incomingEid = remoteEntities[i];
        const outgoingEid = localEntities[i];

        ok(incomingEid !== outgoingEid);

        strictEqual(Networked.networkId[incomingEid], outgoingEid);
        strictEqual(network.networkIdToEntityId.get(outgoingEid), incomingEid);
      }
    });
  });
  describe("deletes serialization", () => {
    it("should #serializeDeletes()", () => {
      const state = mockGameState();
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Owned, eid);
      });

      strictEqual(ownedNetworkedQuery(state.world).length, 3);

      ents.forEach((eid) => {
        // todo: default removeComponent to not clear component data
        removeComponent(state.world, Networked, eid, false);
      });

      serializeDeletes([state, writer]);

      const reader = createCursorView(writer.buffer);

      const count = readUint32(reader);
      strictEqual(count, 3);

      ents.forEach((eid) => {
        strictEqual(readUint32(reader), eid);
      });
    });
    it("should #deserializeDeletes()", () => {
      const state = mockGameState();
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Owned, eid);
      });

      strictEqual(ownedNetworkedQuery(state.world).length, 3);

      serializeCreates([state, writer]);

      const reader = createCursorView(writer.buffer);

      deserializeCreates([state, reader]);

      const remoteEntities = remoteNetworkedQuery(state.world);
      strictEqual(remoteEntities.length, 3);

      ents.forEach((eid) => {
        removeComponent(state.world, Networked, eid, false);
      });

      strictEqual(ownedNetworkedQuery(state.world).length, 0);

      // todo: make queue
      // strictEqual(deletedOwnedNetworkedQuery(state.world).length, 3);

      const writer2 = createCursorView();

      serializeDeletes([state, writer2]);

      remoteEntities.forEach((eid) => {
        ok(entityExists(state.world, eid));
      });

      const reader2 = createCursorView(writer2.buffer);

      deserializeDeletes([state, reader2]);

      remoteEntities.forEach((eid) => {
        ok(!entityExists(state.world, eid));
      });
    });
  });
});
