import { AtomicCounter } from "../allocator/AtomicCounter";

export type ResourceId = number;

export enum ResourceMessageType {
  InitResources = "init-resources",
  LoadResource = "load-resource-2",
  ResourceLoaded = "resource-loaded-2",
}

export interface InitResourcesMessage {
  resourceIdCounter: AtomicCounter;
}

export interface LoadResourceMessage<Props extends ResourceProps = ResourceProps> {
  type: ResourceMessageType.LoadResource;
  resourceType: string;
  id: ResourceId;
  props: Props;
}

export interface ResourceLoadedMessage<Response = unknown> {
  type: ResourceMessageType.ResourceLoaded;
  id: ResourceId;
  loaded: boolean;
  error?: string;
  response?: Response;
}

export interface ResourceProps {
  name?: string;
}
