import { assert } from "vitest";

import { createAsyncTaskRunner } from "./AsyncTaskRunner";

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createAsyncTaskRunner", () => {
  it("should", async () => {
    const taskRunner = createAsyncTaskRunner();
    let result = 0;
    taskRunner.add(1, undefined, function* (args, signal) {
      result = yield Promise.resolve(1);
    });
    taskRunner.update();
    await nextTick();
    taskRunner.update();
    assert.equal(result, 1);
  });
});
