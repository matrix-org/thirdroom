import { atom } from "jotai";

import { OverlayWindow, overlayWindowAtom } from "./overlayWindow";

export enum SidebarTab {
  Home = "Home",
  Friends = "Friends",
  Notifications = "Notifications",
}

const baseSidebarTabAtom = atom<SidebarTab>(SidebarTab.Home);

export const sidebarTabAtom = atom<SidebarTab, [SidebarTab], void>(
  (get) => get(baseSidebarTabAtom),
  (get, set, value) => {
    set(overlayWindowAtom, { type: OverlayWindow.None });
    set(baseSidebarTabAtom, value);
  }
);
