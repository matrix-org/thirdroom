import { atom } from "jotai";

export const whatsNewAtom = atom<boolean>(false);

export const whatsNewDialogAtom = atom<boolean | undefined>(undefined);
export const webSGTutDialogAtom = atom<boolean>(false);
