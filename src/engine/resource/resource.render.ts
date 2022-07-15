import { Thread } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { createLocalResourceModule } from "./resource.common";

const {
  ResourceModule,
  getLocalResource,
  waitForLocalResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
} = createLocalResourceModule<RenderThreadState>(Thread.Render);

export {
  ResourceModule,
  getLocalResource,
  waitForLocalResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
};
