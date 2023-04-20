const loadTimestamp = Date.now();
let requestCounter = 0;

world.onenter = () => {
  matrix.listen();

  matrix.send({
    api: "fromWidget",
    requestId: `request${requestCounter++}`,
    widgetId: "test",
    action: "content_loaded",
    data: {},
  });
};

world.onupdate = (dt) => {
  let event;

  while ((event = matrix.receive())) {
    const { api, action, data } = event;

    if (api === "toWidget" && action === "send_event") {
      const msgtype = data.content?.msgtype;

      if (msgtype === "m.text") {
        const body = data.content?.body;

        if (body) {
          const match = body.match("/echo (.+)");

          const timestamp = data.origin_server_ts || 0;

          if (match && timestamp > loadTimestamp) {
            matrix.send({
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
            });
          }
        }
      }

      matrix.send({
        ...event,
        response: {},
      });
    }
  }
};
