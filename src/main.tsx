import "./live-reload";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { enableMapSet } from "immer";

import { App } from "./ui/App";

enableMapSet();
const rootId = "root";
const rootEl = document.getElementById(rootId);

if (!rootEl) {
  throw new Error(`Can not find root element with id: ${rootId}`);
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  rootEl
);
