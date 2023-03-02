import { atom } from "jotai";

export enum SidebarTab {
  Home = "Home",
  Friends = "Friends",
  Notifications = "Notifications",
}

export const sidebarTabAtom = atom<SidebarTab>(SidebarTab.Home);
