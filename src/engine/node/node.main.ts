interface LocalNode {
  sharedLocalNode: SharedMainThreadLocalNode;
  pannerNode?: PannerNode;
  audioEmitter?: LocalPositionalAudioEmitter;
}
