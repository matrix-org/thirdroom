import { createWorld } from "bitecs";
import { describe, it, expect } from "vitest";

import { World } from "./GameTypes";
import { createRecycleBinContext, recycleBinNextTick, recycleBinReleaseEntities, recycleEntity } from "./RecycleBin";

let disposed: number[] = [];

let idCount = 0;

// TODO: mock the bitecs import for add/removeEntity
function addEntity(world: World): number {
  const id = disposed.length ? disposed.shift()! : idCount++;
  return id;
}

function removeEntity(world: World, eid: number) {
  disposed.push(eid);
}

const resetGlobals = () => {
  disposed = [];
  idCount = 0;
};

describe("RecycleBin", () => {
  describe("recycleEntity", () => {
    beforeEach(resetGlobals);
    it("should push an entity to the active recycle bin", () => {
      const world = createWorld() as World;

      const recycleCtx = createRecycleBinContext();

      const eid = addEntity(world);

      recycleEntity(recycleCtx, eid);

      expect(recycleCtx.active.length).toEqual(1);
      expect(recycleCtx.active[0]).toEqual(eid);
    });
  });

  describe("recycleBinNextTick", () => {
    beforeEach(resetGlobals);
    it("should swap the active recycle bin and add it to the historian", () => {
      const world = createWorld() as World;

      const recycleCtx = createRecycleBinContext();

      const tick = 1;
      const eid1 = addEntity(world);
      const eid2 = addEntity(world);

      recycleEntity(recycleCtx, eid1);
      recycleEntity(recycleCtx, eid2);

      recycleBinNextTick(recycleCtx, tick);

      expect(recycleCtx.active.length).toEqual(0);
      expect(recycleCtx.historian.history.length).toEqual(1);
      expect(recycleCtx.historian.timestamps.length).toEqual(1);
      expect(recycleCtx.historian.history[0].length).toEqual(2);
      expect(recycleCtx.historian.history[0][0]).toEqual(eid1);
      expect(recycleCtx.historian.history[0][1]).toEqual(eid2);
      expect(recycleCtx.historian.timestamps[0]).toEqual(tick);
    });
  });

  describe("recycleBinReleaseEntities", () => {
    beforeEach(resetGlobals);
    it("should call removeEntity on all entities that were in the recycle bins up to lastProcessedTick", () => {
      const world = createWorld({}, 10) as World;

      const recycleCtx = createRecycleBinContext();

      // Tick 1 we create 1 entity but don't dispose it
      const tick1 = 1;
      recycleBinNextTick(recycleCtx, tick1);
      const eid1 = addEntity(world);
      recycleBinReleaseEntities(recycleCtx, world, tick1, removeEntity);
      expect(disposed.length).toEqual(0);

      // end Tick 1

      // Tick 2 we dispose eid1 and eid3
      const tick2 = 2;
      recycleBinNextTick(recycleCtx, tick2);
      addEntity(world); // eid2
      const eid3 = addEntity(world);

      expect(recycleCtx.active.length).toEqual(0);
      recycleEntity(recycleCtx, eid1);
      recycleEntity(recycleCtx, eid3);
      expect(recycleCtx.active.length).toEqual(2);

      expect(recycleCtx.pool.free.length).toEqual(0);
      recycleBinReleaseEntities(recycleCtx, world, tick2, removeEntity);
      expect(recycleCtx.pool.free.length).toEqual(1);
      // end Tick 2

      // Tick 3 we create eid4 and eid5 which should be recycled entities
      const tick3 = 3;
      recycleBinNextTick(recycleCtx, tick3);
      // const eid4 = addEntity(world); // Should be the recycled eid1
      // const eid5 = addEntity(world); // Should be the recycled eid3
      recycleBinReleaseEntities(recycleCtx, world, tick3, removeEntity);
      expect(disposed.length).toEqual(2);
      // end Tick 3

      const tick4 = 4;
      recycleBinNextTick(recycleCtx, tick4);
      const eid4 = addEntity(world); // Should be the recycled eid1
      const eid5 = addEntity(world); // Should be the recycled eid4
      recycleBinReleaseEntities(recycleCtx, world, tick4, removeEntity);
      // end Tick 4

      expect(recycleCtx.active.length).toEqual(0);

      expect([eid1, eid3]).toContain(eid4);
      expect([eid1, eid3]).toContain(eid5);

      // ensure that the new entity IDs are not contained within recycle bins that have not been disposed of yet
      expect(recycleCtx.active).not.toContain(eid4);
      expect(recycleCtx.active).not.toContain(eid5);

      recycleCtx.historian.history.forEach((history) => {
        expect(history).not.toContain(eid4);
        expect(history).not.toContain(eid5);
      });
    });
  });
});
