export type NetworkInterface = {
  localPeerId: string;
  createHandler: (
    onPeerJoined: (peerId: string, audioStream: MediaStream, dataChannel: RTCDataChannel) => void,
    onPeerAudioStreamChanged: (peerId: string, audioStream: MediaStream) => void,
    onPeerLeft: (peerId: string) => void
  ) => () => void;
};
