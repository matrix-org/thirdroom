import { TypedArray } from "bitecs";

export const flagOn = (view: TypedArray, i: number) => {
  const bitsPerMask = view.BYTES_PER_ELEMENT * 8;
  const masksIndex = Math.floor(i / bitsPerMask);
  const index = i - bitsPerMask * masksIndex;
  const bitflag = Math.pow(2, index);
  view[masksIndex] |= bitflag;
};

export const flagOff = (view: TypedArray, i: number) => {
  const bitsPerMask = view.BYTES_PER_ELEMENT * 8;
  const masksIndex = Math.floor(i / bitsPerMask);
  const index = i - bitsPerMask * masksIndex;
  const bitflag = Math.pow(2, index);
  view[masksIndex] &= ~bitflag;
};

export const flagSet = (view: TypedArray, i: number, v: number) => {
  if (v) flagOn(view, i);
  else flagOff(view, i);
};

export const flagGet = (view: TypedArray, i: number) => {
  const bitsPerMask = view.BYTES_PER_ELEMENT * 8;
  const masksIndex = Math.floor(i / bitsPerMask);
  const index = i - bitsPerMask * masksIndex;
  const bitflag = Math.pow(2, index);
  return (bitflag & view[masksIndex]) !== 0 ? 1 : 0;
};

export const flagToggle = (view: TypedArray, i: number) => {
  const bitsPerMask = view.BYTES_PER_ELEMENT * 8;
  const masksIndex = Math.floor(i / bitsPerMask);
  const index = i - bitsPerMask * masksIndex;
  const bitflag = Math.pow(2, index);
  view[masksIndex] ^= bitflag;
  return view[masksIndex] ? 1 : 0;
};
