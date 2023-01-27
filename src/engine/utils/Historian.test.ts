import { vec3 } from "gl-matrix";
import { assert } from "vitest";

import { addHistory, createHistorian, trimHistory } from "./Historian";

describe("Historian Tests", () => {
  it("should addHistory", () => {
    const h = createHistorian<vec3>();
    const t = 100;
    const v: vec3 = [1, 2, 3];
    addHistory(h, t, v);

    assert.equal(h.timestamps.length, 1);
    assert.equal(h.timestamps[0], t);
    assert.equal(h.history.length, 1);
    assert.equal(h.history[0], v);
  });
  it("should trimHistorian", () => {
    const h = createHistorian<vec3>();
    const t = 100;
    const trim = t + 2;
    const v0: vec3 = [1, 2, 3];
    const v1: vec3 = [1, 2, 3];
    const v2: vec3 = [1, 2, 3];
    const v3: vec3 = [1, 2, 3];
    addHistory(h, t + 0, v0);
    addHistory(h, t + 1, v1);
    addHistory(h, t + 2, v2);
    addHistory(h, t + 3, v3);

    trimHistory(h, trim);

    assert.equal(h.timestamps.length, 2);
    assert.equal(h.timestamps.at(-1), t + 3);

    assert.equal(h.history.length, 2);
    assert.equal(h.history.at(-1), v3);
  });
});
