import React from "react";
import ReactDOM from "react-dom";
import "./main.css";
import { Platform, Segment, Navigation, createRouter } from "hydrogen-view-sdk";

import assetPaths from "./assetPaths";
import { RootViewModel } from "./viewModels/RootViewModel";
import { RootView } from "./ui/views/RootView";

function renderRootView(root: HTMLElement, vm: RootViewModel) {
  ReactDOM.render(
    <React.StrictMode>
      <RootView vm={vm} />
    </React.StrictMode>,
    root
  );
}

function allowChilds(parent: typeof Segment, child: typeof Segment) {
  const parentType = parent?.type;

  if (parentType === undefined) return ["session", "login"].includes(child.type);
  if (parentType === "session") return ["left-panel"].includes(child.type);
  if (parentType === "left-panel") return ["room"].includes(child.type);
  return false;
}

async function main() {
  const rootId = "root";
  const root = document.getElementById(rootId);
  if (!root) {
    throw new Error(`Can not find root element with id: ${rootId}`);
  }

  const config = {
    defaultHomeserver: "matrix.org",
  };
  const options = {
    development: import.meta.env.DEV,
  };

  const platform = new Platform(root, assetPaths, config, options);
  const navigation = new Navigation(allowChilds);
  platform.setNavigation(navigation);
  const urlRouter = createRouter({
    navigation: navigation,
    history: platform.history,
  });

  urlRouter.attach();

  const vm = new RootViewModel({
    platform,
    navigation,
    urlCreator: urlRouter,
  });
  vm.load();

  renderRootView(root, vm);
}
main();
