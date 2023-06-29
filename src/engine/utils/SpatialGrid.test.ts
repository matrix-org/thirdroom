import { strictEqual, deepEqual } from "assert";

import { SpatialGrid, createSpatialGrid } from "./SpatialGrid";

describe("SpatialGrid", () => {
  let grid: SpatialGrid;

  beforeEach(() => {
    grid = createSpatialGrid(100, 100, 10);
  });

  test("initialize correctly", () => {
    strictEqual(grid.cellSize, 10);
    strictEqual(grid.toCell(20), 2);
    strictEqual(grid.indexOf(5, 5), 55);
    deepEqual(grid.getCell(5, 5), []);
    strictEqual(grid.getCellX(5), 5);
    strictEqual(grid.getCellY(5), 0);
  });

  test("add, remove, refresh", () => {
    const cellIndex = grid.add(10, 10, 1);
    deepEqual(grid.getCell(1, 1), [1]);
    grid.remove(cellIndex, 1);
    deepEqual(grid.getCell(1, 1), []);
    grid.add(10, 10, 1);
    grid.refresh(20, 20, cellIndex, 1);
    deepEqual(grid.getCell(1, 1), []);
    deepEqual(grid.getCell(2, 2), [1]);
  });

  test("broadphaseRadius", () => {
    grid.add(10, 10, 1);
    grid.add(20, 20, 2);
    const ids = grid.broadphaseRadius(grid.indexOf(1, 1), 3);
    deepEqual(ids, [1, 2]);
  });

  test("broadphasePosition", () => {
    grid.add(10, 10, 1);
    grid.add(20, 20, 2);
    const ids = grid.broadphasePosition(15, 15, 3);
    deepEqual(ids, [1, 2]);
  });

  test("broadphaseView", () => {
    grid.add(10, 10, 1);
    grid.add(20, 20, 2);
    const ids = grid.broadphaseView(15, 15, 3, 3);
    deepEqual(ids, [1, 2]);
  });

  test("broadphaseCell", () => {
    grid.add(10, 10, 1);
    grid.add(20, 20, 2);
    const cells = grid.broadphaseCell(15, 15, 3, 3);
    deepEqual(cells, [[1], [2]]);
  });
});
