if (import.meta.env.MODE === "development") {
  if (navigator.userAgent.includes("Firefox/")) {
    console.warn(
      "Firefox doesn't support import statements in workers yet. Please run with `npm run preview` to run against the production code which bundles workers."
    );
  }
}

if (import.meta.env.MODE === "preview") {
  const { protocol, host } = window.location;

  const ws = new WebSocket(`${protocol === "http:" ? "ws" : "wss"}://${host}`);

  ws.addEventListener("message", ({ data }) => {
    if (data === "rebuilt") {
      window.location.reload();
    }
  });
}
