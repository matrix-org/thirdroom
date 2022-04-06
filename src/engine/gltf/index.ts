export interface GLTFComponentDescription {
  type: string;
  [key: string]: any;
}

export interface GLTFEntityDescription {
  components: GLTFComponentDescription[];
  children?: GLTFEntityDescription[];
}

export interface RemoteGLTF {
  scene: GLTFEntityDescription;
}
