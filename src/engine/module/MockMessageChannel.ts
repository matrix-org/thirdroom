class TransferableMessageEvent<T> extends MessageEvent<T> {
  public transferList?: any[];
}

export class MockMessagePort {
  private started = false;
  private closed = false;
  private eventHandlers: Map<string, ((event: any) => void)[]> = new Map();
  private messageQueue: any[] = [];

  constructor(private messageChannel: MockMessageChannel, private target: string) {}

  addEventListener(event: string, handler: (...args: any[]) => void) {
    let handlers = this.eventHandlers.get(event);

    if (!handlers) {
      handlers = [];
      this.eventHandlers.set(event, handlers);
    }

    handlers.push(handler);
  }

  removeEventListener(event: string, handler: (...args: any[]) => void) {
    const handlers = this.eventHandlers.get(event);

    if (!handlers) {
      return;
    }

    const index = handlers.indexOf(handler);

    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  postMessage(message: any, transferList?: any[]) {
    if (this.closed) {
      return;
    }

    const event = new TransferableMessageEvent("message", { data: message });
    event.transferList = transferList;

    if (this.started) {
      ((this.messageChannel as any)[this.target] as MockMessagePort).dispatchEvent(event);
    } else {
      this.messageQueue.push(event);
    }
  }

  dispatchEvent(event: any) {
    const eventHandlers = this.eventHandlers.get(event.type);

    if (eventHandlers) {
      for (let i = 0; i < eventHandlers.length; i++) {
        eventHandlers[i](event);
      }
    }
  }

  start() {
    this.started = true;

    while (this.messageQueue.length) {
      const event = this.messageQueue.pop();

      if (!event) {
        break;
      }

      ((this.messageChannel as any)[this.target] as MockMessagePort).dispatchEvent(event);
    }
  }

  close() {
    this.closed = true;
    this.messageQueue.length = 0;
  }
}

export class MockMessageChannel {
  port1: MockMessagePort;
  port2: MockMessagePort;

  constructor() {
    this.port1 = new MockMessagePort(this, "port2");
    this.port2 = new MockMessagePort(this, "port1");
  }
}

export class MockWorkerMessageChannel extends MockMessageChannel {
  constructor(worker: Worker) {
    super();

    worker.addEventListener("message", (event) => {
      this.port2.postMessage(event.data);
    });

    this.port2.addEventListener("message", (event) => {
      worker.postMessage(event.data, event.transferList);
    });

    this.port2.start();
  }
}
