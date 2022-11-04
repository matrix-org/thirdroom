import { RenderThreadState } from "../renderer/renderer.render";
import { createLocalResourceModule } from "./resource.common";

const {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
} = createLocalResourceModule<RenderThreadState>();

export {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
};
