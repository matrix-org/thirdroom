import { LocalPositionalAudioEmitter } from "../audio/audio.main";
import { AudioNodeTripleBuffer } from "./node.common";

export interface MainNode {
  resourceId: number;
  audioSharedNode: AudioNodeTripleBuffer;
  audioEmitterPannerNode?: PannerNode;
  audioEmitter?: LocalPositionalAudioEmitter;
}

// todo

// const pannerNode = audio.context.createPanner();

// const gainNode = audio.context.createGain();
// gainNode.gain.value = props.gain;
// pannerNode.connect(gainNode);

// for (const source of sources) {
//   source.gainNode.connect(pannerNode);
// }

// gainNode.connect(audio.mainGain);

// pannerNode.coneInnerAngle = props.coneInnerAngle;
// pannerNode.coneOuterAngle = props.coneOuterAngle;
// pannerNode.coneOuterGain = props.coneOuterGain;
// pannerNode.distanceModel = AudioEmitterDistanceModelMap[props.distanceModel];
// pannerNode.maxDistance = props.maxDistance;
// pannerNode.refDistance = props.refDistance;
// pannerNode.rolloffFactor = props.rolloffFactor;
// pannerNode.panningModel = "HRTF";
