import { IMainThreadContext } from "../MainThread";
import { Thread } from "../module/module.common";
import { createLocalResourceModule } from "./resource.common";

const {
  ResourceModule,
  getLocalResource,
  waitForLocalResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
} = createLocalResourceModule<IMainThreadContext>(Thread.Main);

export {
  ResourceModule,
  getLocalResource,
  waitForLocalResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
};
