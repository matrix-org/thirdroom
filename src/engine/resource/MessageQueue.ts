import { BaseThreadContext, registerMessageHandler, Thread } from "../module/module.common";

export interface MessageQueueMessage<Message> {
  type: string;
  messages: Message[];
}

export function createMessageQueueConsumer<ThreadContext extends BaseThreadContext, Message>(
  type: string
): [() => Message[], (ctx: ThreadContext) => () => void] {
  let index = 0;

  const queues: [Message[], Message[]] = [[], []];

  const drainMessages = () => {
    const out = queues[index];
    index = index ? 0 : 1;
    queues[index].length = 0;
    return out;
  };

  const onMessage = (ctx: ThreadContext, message: MessageQueueMessage<Message>) => {
    const messages = message.messages;
    for (let i = 0; i < messages.length; i++) {
      queues[index].push(messages[i]);
    }
  };

  const registerHandler = (ctx: ThreadContext) => registerMessageHandler(ctx, type, onMessage);

  return [drainMessages, registerHandler];
}

export function createMessageQueueProducer<ThreadContext extends BaseThreadContext, Message>(
  type: string
): [(message: Message) => void, (ctx: ThreadContext, batchSize?: number) => void] {
  const queue: Message[] = [];

  const queueMessage = (message: Message) => {
    queue.push(message);
  };

  const sendMessages = (ctx: ThreadContext, batchSize?: number) => {
    if (queue.length !== 0) {
      const messages = queue.splice(0, Math.min(queue.length, batchSize || queue.length));

      ctx.sendMessage<MessageQueueMessage<Message>>(Thread.Main, {
        type,
        messages,
      });

      ctx.sendMessage<MessageQueueMessage<Message>>(Thread.Render, {
        type,
        messages,
      });
    }
  };

  return [queueMessage, sendMessages];
}
