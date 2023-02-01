import { vec3 } from "gl-matrix";
import { assert } from "vitest";

import { createPool, obtainFromPool, releaseToPool } from "./Pool";

describe("Historian Tests", () => {
  it("should createPool", () => {
    const pool = createPool<vec3>(
      () => vec3.create(),
      (v) => vec3.zero(v)
    );

    assert.equal(pool.free.length, 0);
    assert.ok("free" in pool);
    assert.ok("create" in pool);
    assert.ok("dispose" in pool);
  });
  it("should obtainFromPool", () => {
    const pool = createPool<vec3>(
      () => vec3.create(),
      (v) => vec3.zero(v)
    );

    const v = obtainFromPool(pool);
    assert.ok(v !== undefined);
    assert.equal(v[0], 0);
    assert.equal(v[1], 0);
    assert.equal(v[2], 0);
  });
  it("should releaseToPool", () => {
    const pool = createPool<vec3>(
      () => vec3.create(),
      (v) => vec3.zero(v)
    );

    const v0 = obtainFromPool(pool);
    assert.equal(v0[0], 0);
    assert.equal(v0[1], 0);
    assert.equal(v0[2], 0);
    vec3.set(v0, 1, 2, 3);

    const v1 = obtainFromPool(pool);
    assert.equal(v1[0], 0);
    assert.equal(v1[1], 0);
    assert.equal(v1[2], 0);
    vec3.set(v1, 4, 5, 6);

    const v2 = obtainFromPool(pool);
    assert.equal(v2[0], 0);
    assert.equal(v2[1], 0);
    assert.equal(v2[2], 0);
    vec3.set(v2, 7, 8, 9);

    assert.equal(pool.free.length, 0);

    releaseToPool(pool, v0);

    assert.equal(pool.free.length, 1);

    releaseToPool(pool, v1);

    assert.equal(pool.free.length, 2);

    const v3 = obtainFromPool(pool);
    assert.equal(v3[0], 0);
    assert.equal(v3[1], 0);
    assert.equal(v3[2], 0);

    assert.equal(pool.free.length, 1);

    obtainFromPool(pool);
    obtainFromPool(pool);
    obtainFromPool(pool);

    assert.equal(pool.free.length, 0);
  });
});
