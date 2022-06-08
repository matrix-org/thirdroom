import { IMainThreadContext } from "../MainThread";
import { createLocalResourceModule } from "./resource.common";

const { ResourceModule, getLocalResource, waitForLocalResource, registerResourceLoader } =
  createLocalResourceModule<IMainThreadContext>();

export { ResourceModule, getLocalResource, waitForLocalResource, registerResourceLoader };
