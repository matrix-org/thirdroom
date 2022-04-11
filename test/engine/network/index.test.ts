import { describe, it } from "vitest";
import { ok, strictEqual } from "assert";
import { addComponent, addEntity, createWorld, entityExists, removeComponent } from "bitecs";

import { Transform } from "../../../src/engine/component/transform";
import { GameState } from "../../../src/engine/GameWorker";
import {
  createNetworkId,
  deletedNetworkedQuery,
  deserializeCreates,
  deserializeDeletes,
  deserializeTransformChanged,
  deserializeUpdatesChanged,
  getClientIdFromNetworkId,
  getLocalIdFromNetworkId,
  remoteNetworkedQuery,
  Mine,
  Networked,
  localNetworkedQuery,
  serializeCreates,
  serializeDeletes,
  serializeTransformChanged,
  serializeUpdatesChanged,
  serializeTransformSnapshot,
  deserializeTransformSnapshot,
  serializeUpdatesSnapshot,
  deserializeUpdatesSnapshot,
} from "../../../src/engine/network";
import { createCursorView, readFloat32, readUint32, readUint8 } from "../../../src/engine/network/CursorView";

describe("Network Tests", () => {
  describe("networkId", () => {
    it("should #getClientIdFromNetworkId()", () => {
      const nid = 0xfff0_000f;
      strictEqual(getClientIdFromNetworkId(nid), 0x000f);
    });
    it("should #getLocalIdFromNetworkId()", () => {
      const nid = 0xfff0_000f;
      strictEqual(getLocalIdFromNetworkId(nid), 0xfff0);
    });
    it("should #createNetworkId", () => {
      const state = {
        network: { clientId: 0x00ff, localIdCount: 0x000f, removedLocalIds: [] },
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
      const rotation = Transform.rotation[eid];
      position.set([1, 2, 3]);
      rotation.set([4, 5, 6]);

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
      const rotation = Transform.rotation[eid];
      position.set([1, 2, 3]);
      rotation.set([4, 5, 6]);

      serializeTransformSnapshot(writer, eid);

      position.set([0, 0, 0]);
      rotation.set([0, 0, 0]);

      const reader = createCursorView(writer.buffer);

      deserializeTransformSnapshot(reader, eid);

      strictEqual(position[0], 1);
      strictEqual(position[1], 2);
      strictEqual(position[2], 3);

      strictEqual(rotation[0], 4);
      strictEqual(rotation[1], 5);
      strictEqual(rotation[2], 6);
    });
    it("should #serializeTransformChanged() with all values", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const rotation = Transform.rotation[eid];
      position.set([1, 2, 3]);
      rotation.set([4, 5, 6]);

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
      const rotation = Transform.rotation[eid];
      position.set([0, 2, 0]);
      rotation.set([4, 0, 6]);

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

      const rotX = readFloat32(reader);
      strictEqual(rotX, 4);

      // const rotY = readFloat32(reader);
      // strictEqual(rotY, 0);

      const rotZ = readFloat32(reader);
      strictEqual(rotZ, 6);
    });
    it("should #deserializeTransformChanged() with all values", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const rotation = Transform.rotation[eid];
      position.set([1, 2, 3]);
      rotation.set([4, 5, 6]);

      serializeTransformChanged(writer, eid);

      position.set([0, 0, 0]);
      rotation.set([0, 0, 0]);

      const reader = createCursorView(writer.buffer);

      deserializeTransformChanged(reader, eid);

      strictEqual(position[0], 1);
      strictEqual(position[1], 2);
      strictEqual(position[2], 3);

      strictEqual(rotation[0], 4);
      strictEqual(rotation[1], 5);
      strictEqual(rotation[2], 6);
    });
    it("should #deserializeTransformChanged() with some values", () => {
      const writer = createCursorView();
      const eid = 0;

      const position = Transform.position[eid];
      const rotation = Transform.rotation[eid];
      position.set([0, 2, 0]);
      rotation.set([4, 0, 6]);

      serializeTransformChanged(writer, eid);

      position.set([0, 0, 0]);
      rotation.set([0, 0, 0]);

      const reader = createCursorView(writer.buffer);

      deserializeTransformChanged(reader, eid);

      strictEqual(position[0], 0);
      strictEqual(position[1], 2);
      strictEqual(position[2], 0);

      strictEqual(rotation[0], 4);
      strictEqual(rotation[1], 0);
      strictEqual(rotation[2], 6);
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
        const rotation = Transform.rotation[eid];
        position.set([1, 2, 3]);
        rotation.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Mine, eid);
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

        const rotation = Transform.rotation[eid];
        strictEqual(rotation[0], readFloat32(reader));
        strictEqual(rotation[1], readFloat32(reader));
        strictEqual(rotation[2], readFloat32(reader));
      });
    });
    it("should #deserializeUpdatesSnapshot()", () => {
      const state = { world: createWorld(), network: { idMap: new Map() } } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Transform, eid);
        const position = Transform.position[eid];
        const rotation = Transform.rotation[eid];
        position.set([1, 2, 3]);
        rotation.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        state.network.idMap.set(eid, eid);
        addComponent(state.world, Mine, eid);
      });

      serializeUpdatesSnapshot([state, writer]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const rotation = Transform.rotation[eid];
        position.set([0, 0, 0]);
        rotation.set([0, 0, 0]);
      });

      const reader = createCursorView(writer.buffer);

      deserializeUpdatesSnapshot([state, reader]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const rotation = Transform.rotation[eid];
        strictEqual(position[0], 1);
        strictEqual(position[1], 2);
        strictEqual(position[2], 3);
        strictEqual(rotation[0], 4);
        strictEqual(rotation[1], 5);
        strictEqual(rotation[2], 6);
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
        const rotation = Transform.rotation[eid];
        position.set([1, 2, 3]);
        rotation.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Mine, eid);
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

        const rotation = Transform.rotation[eid];
        strictEqual(rotation[0], readFloat32(reader));
        strictEqual(rotation[1], readFloat32(reader));
        strictEqual(rotation[2], readFloat32(reader));
      });
    });
    it("should #deserializeUpdatesChanged()", () => {
      const state = { world: createWorld(), network: { idMap: new Map() } } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Transform, eid);
        const position = Transform.position[eid];
        const rotation = Transform.rotation[eid];
        position.set([1, 2, 3]);
        rotation.set([4, 5, 6]);
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        state.network.idMap.set(eid, eid);
        addComponent(state.world, Mine, eid);
      });

      serializeUpdatesChanged([state, writer]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const rotation = Transform.rotation[eid];
        position.set([0, 0, 0]);
        rotation.set([0, 0, 0]);
      });

      const reader = createCursorView(writer.buffer);

      deserializeUpdatesChanged([state, reader]);

      ents.forEach((eid) => {
        const position = Transform.position[eid];
        const rotation = Transform.rotation[eid];
        strictEqual(position[0], 1);
        strictEqual(position[1], 2);
        strictEqual(position[2], 3);
        strictEqual(rotation[0], 4);
        strictEqual(rotation[1], 5);
        strictEqual(rotation[2], 6);
      });
    });
  });
  describe("creates serialization", () => {
    it("should #serializeCreates()", () => {
      const state = { world: createWorld() } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Mine, eid);
      });

      strictEqual(localNetworkedQuery(state.world).length, 3);

      serializeCreates([state, writer]);

      const reader = createCursorView(writer.buffer);

      const count = readUint32(reader);
      strictEqual(count, 3);

      ents.forEach((eid) => {
        strictEqual(readUint32(reader), eid);
      });
    });
    it("should #deserializeCreates()", () => {
      const state = { world: createWorld(), network: { idMap: new Map() } } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Mine, eid);
      });

      const localEntities = localNetworkedQuery(state.world);
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
        strictEqual(state.network.idMap.get(outgoingEid), incomingEid);
      }
    });
  });
  describe("deletes serialization", () => {
    it("should #serializeDeletes()", () => {
      const state = { world: createWorld(), network: { idMap: new Map() } } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Mine, eid);
      });

      strictEqual(localNetworkedQuery(state.world).length, 3);

      ents.forEach((eid) => {
        removeComponent(state.world, Networked, eid);
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
      const state = { world: createWorld(), network: { idMap: new Map() } } as unknown as GameState;
      const writer = createCursorView();

      const ents = Array(3)
        .fill(0)
        .map(() => addEntity(state.world));

      ents.forEach((eid) => {
        addComponent(state.world, Networked, eid);
        Networked.networkId[eid] = eid;
        addComponent(state.world, Mine, eid);
      });

      strictEqual(localNetworkedQuery(state.world).length, 3);

      serializeCreates([state, writer]);

      const reader = createCursorView(writer.buffer);

      deserializeCreates([state, reader]);

      const remoteEntities = remoteNetworkedQuery(state.world);
      strictEqual(remoteEntities.length, 3);

      ents.forEach((eid) => {
        removeComponent(state.world, Networked, eid);
      });

      strictEqual(localNetworkedQuery(state.world).length, 0);

      strictEqual(deletedNetworkedQuery(state.world).length, 3);

      const writer2 = createCursorView();

      serializeDeletes([state, writer2]);

      const reader2 = createCursorView(writer.buffer);

      remoteEntities.forEach((eid) => {
        ok(entityExists(state.world, eid));
      });

      deserializeDeletes([state, reader2]);

      remoteEntities.forEach((eid) => {
        ok(!entityExists(state.world, eid));
      });
    });
  });
});
