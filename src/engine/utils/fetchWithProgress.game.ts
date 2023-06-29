import { GameContext } from "../GameTypes";
import { Thread } from "../module/module.common";

export const FetchProgressMessageType = "fetch-progress-message";

export interface FetchProgressMessage {
  type: typeof FetchProgressMessageType;
  status: { loaded: number; total: number };
}

function reportStatus(ctx: GameContext, status: { loaded: number; total: number }) {
  ctx.sendMessage<FetchProgressMessage>(Thread.Main, {
    type: FetchProgressMessageType,
    status,
  });
}

export async function fetchWithProgress(ctx: GameContext, url: string, options?: RequestInit): Promise<Response> {
  const status = { loaded: 0, total: 0 };

  const response = await fetch(url, options);
  const contentLength = response.headers.get("content-length");
  const total = parseInt(contentLength || "0", 10);

  status.total = total;
  reportStatus(ctx, status);

  let loaded = 0;

  const res = new Response(
    new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (reader)
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.byteLength;
            status.loaded = loaded;
            reportStatus(ctx, status);
            controller.enqueue(value);
          }
        controller.close();
      },
    })
  );

  return res;
}
