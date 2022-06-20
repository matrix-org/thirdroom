import { RenderThreadState } from "../renderer/renderer.render";
import { createLocalResourceModule } from "./resource.common";

const { ResourceModule, getLocalResource, waitForLocalResource, registerResourceLoader } =
  createLocalResourceModule<RenderThreadState>();

export { ResourceModule, getLocalResource, waitForLocalResource, registerResourceLoader };
