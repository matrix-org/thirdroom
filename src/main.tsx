import "./live-reload";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from "react-router-dom";
import { enableMapSet } from "immer";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

import { App } from "./ui/App";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string) ?? "development",
  release: import.meta.env.VITE_SENTRY_RELEASE as string,
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
  tracesSampleRate: 1.0,
});

enableMapSet();
const rootId = "root";
const rootEl = document.getElementById(rootId);

if (!rootEl) {
  throw new Error(`Can not find root element with id: ${rootId}`);
}

ReactDOM.render(
  // <React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  // </React.StrictMode>,
  rootEl
);
