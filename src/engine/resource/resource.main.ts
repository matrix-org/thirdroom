import { IMainThreadContext } from "../MainThread";
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
} = createLocalResourceModule<IMainThreadContext>();

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
