export const InputArray = [
  'Escape',
  'Backquote',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'Digit0',
  'Minus',
  'Equal',
  'Backspace',
  'Tab',
  'KeyQ',
  'KeyW',
  'KeyE',
  'KeyR',
  'KeyT',
  'KeyY',
  'KeyU',
  'KeyI',
  'KeyO',
  'KeyP',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'CapsLock',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyJ',
  'KeyK',
  'KeyL',
  'Semicolon',
  'Quote',
  'Enter',
  'ShiftLeft',
  'KeyZ',
  'KeyX',
  'KeyC',
  'KeyV',
  'KeyB',
  'KeyN',
  'KeyM',
  'Comma',
  'Period',
  'Slash',
  'ShiftRight',
  'ControlLeft',
  'AltLeft',
  'MetaLeft',
  'Space',
  'MetaRight',
  'AltRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
];

export type InputObjectType = {
  Escape: number
  Backquote: number
  Digit1: number
  Digit2: number
  Digit3: number
  Digit4: number
  Digit5: number
  Digit6: number
  Digit7: number
  Digit8: number
  Digit9: number
  Digit0: number
  Minus: number
  Equal: number
  Backspace: number
  Tab: number
  KeyQ: number
  KeyW: number
  KeyE: number
  KeyR: number
  KeyT: number
  KeyY: number
  KeyU: number
  KeyI: number
  KeyO: number
  KeyP: number
  BracketLeft: number
  BracketRight: number
  Backslash: number
  CapsLock: number
  KeyA: number
  KeyS: number
  KeyD: number
  KeyF: number
  KeyG: number
  KeyH: number
  KeyJ: number
  KeyK: number
  KeyL: number
  Semicolon: number
  Quote: number
  Enter: number
  ShiftLeft: number
  KeyZ: number
  KeyX: number
  KeyC: number
  KeyV: number
  KeyB: number
  KeyN: number
  KeyM: number
  Comma: number
  Period: number
  Slash: number
  ShiftRight: number
  ControlLeft: number
  AltLeft: number
  MetaLeft: number
  Space: number
  MetaRight: number
  AltRight: number
  ArrowLeft: number
  ArrowUp: number
  ArrowRight: number
  ArrowDown: number
}

export const Input: InputObjectType = InputArray.reduce<{ [key: string]: number}>((a,v,i) => {
  a[v] = i;
  return a;
}, {}) as InputObjectType;
