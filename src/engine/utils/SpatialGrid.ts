export interface SpatialGrid {
  cellSize: number;
  toCell: (x: number) => number;
  indexOf: (x: number, y: number) => number;
  getCell: (x: number, y: number) => number[];
  getCellX: (i: number) => number;
  getCellY: (i: number) => number;
  add: (x: number, y: number, id: number) => number;
  remove: (cellIndex: number, id: number) => void;
  refresh: (x: number, y: number, cellIndex: number, id: number) => number;
  broadphaseRadius: (cellIndex: number, radius?: number) => number[];
  broadphasePosition: (x: number, y: number, r: number) => number[];
  broadphaseView: (x: number, y: number, cellsWide: number, cellsHigh: number) => number[];
  broadphaseCell: (x: number, y: number, cellsWide: number, cellsHigh: number) => number[][];
}

export function createSpatialGrid(width: number, height: number, cellSize: number): SpatialGrid {
  const w: number = Math.ceil(width / cellSize);
  const h: number = Math.ceil(height / cellSize);

  const grid: number[][] = Array(w * h)
    .fill(null)
    .map(() => []);

  const toCell = (x: number): number => Math.floor(x / cellSize);

  const indexOf = (x: number, y: number): number => x + w * y;
  const getCell = (x: number, y: number): number[] => grid[indexOf(x, y)];

  const getCellX = (i: number): number => i % w;
  const getCellY = (i: number): number => Math.floor(i / w);

  const inBounds = (x: number, y: number): boolean => x >= 0 && x < w && y >= 0 && y < h;

  const add = (x: number, y: number, id: number): number => {
    const cx: number = toCell(x);
    const cy: number = toCell(y);
    const cellIndex: number = indexOf(cx, cy);

    if (!grid[cellIndex]) {
      throw new Error(`Cell index ${cellIndex} out of bounds of grid`);
    }

    grid[cellIndex].push(id);

    return cellIndex;
  };

  const remove = (cellIndex: number, id: number): void => {
    if (!grid[cellIndex]) return;
    grid[cellIndex].splice(grid[cellIndex].indexOf(id), 1);
  };

  const refresh = (x: number, y: number, cellIndex: number, id: number): number => {
    remove(cellIndex, id);
    return add(x, y, id);
  };

  const broadphaseRadius = (cellIndex: number, radius = 3): number[] => {
    const x: number = getCellX(cellIndex);
    const y: number = getCellY(cellIndex);

    const startGridX: number = Math.ceil(x - radius / 2);
    const startGridY: number = Math.ceil(y - radius / 2);
    const endGridX: number = Math.floor(x + radius / 2);
    const endGridY: number = Math.floor(y + radius / 2);

    const nearby: number[] = [];

    for (let xi = startGridX; xi <= endGridX; xi++) {
      for (let yi = startGridY; yi <= endGridY; yi++) {
        if (!inBounds(xi, yi)) continue;
        getCell(xi, yi).forEach((id: number) => nearby.push(id));
      }
    }

    return nearby;
  };

  const broadphasePosition = (x: number, y: number, r: number): number[] => {
    const cx: number = toCell(x);
    const cy: number = toCell(y);
    const cellIndex: number = indexOf(cx, cy);
    return broadphaseRadius(cellIndex, r);
  };

  const broadphaseView = (x: number, y: number, cellsWide: number, cellsHigh: number): number[] => {
    const cx: number = toCell(x);
    const cy: number = toCell(y);

    const startGridX: number = Math.ceil(cx - cellsWide / 2);
    const startGridY: number = Math.ceil(cy - cellsHigh / 2);
    const endGridX: number = Math.floor(cx + cellsWide / 2);
    const endGridY: number = Math.floor(cy + cellsHigh / 2);

    const nearby: number[] = [];

    for (let xi = startGridX; xi <= endGridX; xi++) {
      for (let yi = startGridY; yi <= endGridY; yi++) {
        if (!inBounds(xi, yi)) continue;
        getCell(xi, yi).forEach((id: number) => nearby.push(id));
      }
    }

    return nearby;
  };

  const broadphaseCell = (x: number, y: number, cellsWide: number, cellsHigh: number): number[][] => {
    const cx: number = toCell(x);
    const cy: number = toCell(y);

    const startGridX: number = Math.ceil(cx - cellsWide / 2);
    const startGridY: number = Math.ceil(cy - cellsHigh / 2);
    const endGridX: number = Math.floor(cx + cellsWide / 2);
    const endGridY: number = Math.floor(cy + cellsHigh / 2);

    const cells: number[][] = [];

    for (let xi = startGridX; xi <= endGridX; xi++) {
      for (let yi = startGridY; yi <= endGridY; yi++) {
        if (!inBounds(xi, yi)) continue;
        const cell = getCell(xi, yi);
        if (cell.length) cells.push(cell);
      }
    }

    return cells;
  };

  return {
    cellSize,
    toCell,
    indexOf,
    getCell,
    getCellX,
    getCellY,
    add,
    remove,
    refresh,
    broadphaseRadius,
    broadphasePosition,
    broadphaseView,
    broadphaseCell,
  };
}
