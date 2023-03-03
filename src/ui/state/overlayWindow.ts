import { atom } from "jotai";

export enum OverlayWindow {
  None = "none",
  CreateWorld = "create_world",
  UserProfile = "user_profile",
  WorldSettings = "world_settings",
  Discover = "discover",
}

type OverlayWindowValue =
  | {
      type: OverlayWindow.None;
    }
  | {
      type: OverlayWindow.CreateWorld;
    }
  | {
      type: OverlayWindow.UserProfile;
    }
  | {
      type: OverlayWindow.WorldSettings;
      roomId: string;
    }
  | {
      type: OverlayWindow.Discover;
    };

export const overlayWindowAtom = atom<OverlayWindowValue>({ type: OverlayWindow.None });
