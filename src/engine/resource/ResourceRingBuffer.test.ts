import { availableRead } from "@thirdroom/ringbuffer";
import { describe, expect } from "vitest";

import {
  createResourceRingBuffer,
  enqueueResourceRingBuffer,
  dequeueResourceRingBuffer,
  ResourceRingBufferItem,
} from "./ResourceRingBuffer";

describe("ResourceRingBuffer", () => {
  it("should enqueue and dequeue a create resource command", () => {
    const ringBuffer = createResourceRingBuffer();

    const eid = 2;
    const tick = 1;

    enqueueResourceRingBuffer(ringBuffer, eid, tick);

    const result = dequeueResourceRingBuffer(ringBuffer, { eid: 0, tick: 0 });

    expect(result).toEqual({ eid, tick });
  });

  it("should process multiple commands", () => {
    const ringBuffer = createResourceRingBuffer();

    const tick = 1;

    const items: ResourceRingBufferItem[] = [
      {
        eid: 1,
        tick,
      },
      {
        eid: 2,
        tick,
      },
      {
        eid: 3,
        tick,
      },
    ];

    for (const item of items) {
      enqueueResourceRingBuffer(ringBuffer, item.eid, item.tick);
    }

    let index = 0;

    while (availableRead(ringBuffer)) {
      const item = dequeueResourceRingBuffer(ringBuffer, { eid: 0, tick: 0 });
      expect(item).toEqual(items[index++]);
    }

    expect(index).toEqual(items.length);
  });

  it("should error on overflow", () => {
    const ringBuffer = createResourceRingBuffer(3);

    enqueueResourceRingBuffer(ringBuffer, 1, 1);
    enqueueResourceRingBuffer(ringBuffer, 2, 2);
    enqueueResourceRingBuffer(ringBuffer, 3, 2);
    expect(() => enqueueResourceRingBuffer(ringBuffer, 4, 2)).toThrowError("Resource ring buffer full.");
  });

  it("should return 0 from availableRead when empty", () => {
    const ringBuffer = createResourceRingBuffer();
    expect(availableRead(ringBuffer)).toEqual(0);
  });
});
