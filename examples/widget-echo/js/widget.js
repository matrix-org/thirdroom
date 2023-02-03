const loadTimestamp = Date.now();
let requestCounter = 0;

matrix.sendWidgetMessage(
  JSON.stringify({
    api: "fromWidget",
    requestId: `request${requestCounter++}`,
    widgetId: "test",
    action: "content_loaded",
    data: {},
  })
);

onupdate = (dt) => {
  let messageStr = matrix.receiveWidgetMessage();

  while (messageStr) {
    const message = JSON.parse(messageStr);

    if (message.api === "toWidget" && message.action === "send_event") {
      const msgtype = message.data.content?.msgtype;

      if (msgtype === "m.text") {
        const body = message.data.content?.body;

        if (body) {
          const match = body.match("/echo (.+)");

          const timestamp = message.data.origin_server_ts || 0;

          if (match && timestamp > loadTimestamp) {
            matrix.sendWidgetMessage(
              JSON.stringify({
                api: "fromWidget",
                requestId: `request${requestCounter++}`,
                widgetId: "test",
                action: "send_event",
                data: {
                  type: "m.room.message",
                  content: {
                    msgtype: "m.text",
                    body: match[1],
                  },
                },
              })
            );
          }
        }
      }

      matrix.sendWidgetMessage(
        JSON.stringify({
          ...message,
          response: {},
        })
      );
    }

    messageStr = matrix.receiveWidgetMessage();
  }
};
