import { describe, expect } from "vitest";

import {
  createResourceRingBuffer,
  enqueueResourceRingBuffer,
  drainResourceRingBuffer,
  ResourceCommand,
} from "./DisposeResourceRingBuffer";

describe("DisposeResourceRingBuffer", () => {
  it("should enqueue and drain a create resource command", () => {
    const ringBuffer = createResourceRingBuffer();

    const command = ResourceCommand.Create;
    const eid = 2;
    const tick = 1;

    enqueueResourceRingBuffer(ringBuffer, command, tick, eid);

    const results = drainResourceRingBuffer(ringBuffer, tick);

    expect(results.length).toEqual(1);

    const [resultCommand, resultEid] = results[0];

    expect(resultCommand).toEqual(ResourceCommand.Create);
    expect(resultEid).toEqual(eid);
  });

  it("should reset the results array between runs", () => {
    const ringBuffer = createResourceRingBuffer();

    const command = ResourceCommand.Create;
    const eid = 2;
    const tick = 1;

    enqueueResourceRingBuffer(ringBuffer, command, tick, eid);

    const results1 = drainResourceRingBuffer(ringBuffer, tick);

    expect(results1.length).toEqual(1);

    const [resultCommand, resultEid] = results1[0];

    expect(resultCommand).toEqual(ResourceCommand.Create);
    expect(resultEid).toEqual(eid);

    const results2 = drainResourceRingBuffer(ringBuffer, tick);

    expect(results2.length).toEqual(0);
  });

  it("should process multiple commands", () => {
    const ringBuffer = createResourceRingBuffer();

    const tick = 1;

    const commands = [
      {
        command: ResourceCommand.Create,
        eid: 1,
        tick,
      },
      {
        command: ResourceCommand.Create,
        eid: 2,
        tick,
      },
      {
        command: ResourceCommand.Dispose,
        eid: 2,
        tick,
      },
      {
        command: ResourceCommand.Create,
        eid: 2,
        tick,
      },
    ];

    for (const command of commands) {
      enqueueResourceRingBuffer(ringBuffer, command.command, command.tick, command.eid);
    }

    const results = drainResourceRingBuffer(ringBuffer, tick);

    expect(results.length).toEqual(commands.length);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const command = commands[i];
      expect(result).toEqual([command.command, command.eid]);
    }

    const results2 = drainResourceRingBuffer(ringBuffer, tick);

    expect(results2.length).toEqual(0);
  });

  it("should process commands from multiple ticks", () => {
    const ringBuffer = createResourceRingBuffer();

    const commands = [
      {
        command: ResourceCommand.Create,
        eid: 1,
        tick: 1,
      },
      {
        command: ResourceCommand.Create,
        eid: 2,
        tick: 1,
      },
      {
        command: ResourceCommand.Dispose,
        eid: 2,
        tick: 2,
      },
      {
        command: ResourceCommand.Create,
        eid: 2,
        tick: 2,
      },
      {
        command: ResourceCommand.Create,
        eid: 3,
        tick: 3,
      },
      {
        command: ResourceCommand.Dispose,
        eid: 1,
        tick: 3,
      },
    ];

    for (const command of commands) {
      enqueueResourceRingBuffer(ringBuffer, command.command, command.tick, command.eid);
    }

    const results1 = drainResourceRingBuffer(ringBuffer, 1);

    expect(results1.length).toEqual(2);

    for (let i = 0; i < 2; i++) {
      const result = results1[i];
      const command = commands[i];
      expect(result).toEqual([command.command, command.eid]);
    }

    const results2 = drainResourceRingBuffer(ringBuffer, 2);

    expect(results2.length).toEqual(2);

    for (let i = 0; i < 2; i++) {
      const result = results2[i];
      const command = commands[i + 2];
      expect(result).toEqual([command.command, command.eid]);
    }

    const results3 = drainResourceRingBuffer(ringBuffer, 3);

    expect(results3.length).toEqual(2);

    for (let i = 0; i < 2; i++) {
      const result = results3[i];
      const command = commands[i + 4];
      expect(result).toEqual([command.command, command.eid]);
    }
  });

  it("should error on overflow", () => {
    const ringBuffer = createResourceRingBuffer(3);

    enqueueResourceRingBuffer(ringBuffer, ResourceCommand.Create, 1, 1);
    enqueueResourceRingBuffer(ringBuffer, ResourceCommand.Create, 1, 2);
    enqueueResourceRingBuffer(ringBuffer, ResourceCommand.Dispose, 1, 2);
    expect(() => enqueueResourceRingBuffer(ringBuffer, ResourceCommand.Create, 1, 2)).toThrowError(
      "Resource ring buffer full."
    );
  });

  it("should return an empty array when the ring buffer is empty", () => {
    const ringBuffer = createResourceRingBuffer();

    const results = drainResourceRingBuffer(ringBuffer, 1);

    expect(results.length).toEqual(0);
  });
});
