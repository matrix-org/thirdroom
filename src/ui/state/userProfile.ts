import { atom } from "jotai";

interface UserProfileState {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarModelUrl?: string;
  avatarModelPreviewUrl?: string;
}

const baseUserProfileAtom = atom<UserProfileState>({
  userId: "@dummy:server.xyz",
  displayName: "dummy",
  avatarUrl: undefined,
  avatarModelUrl: undefined,
  avatarModelPreviewUrl: undefined,
});

export const userProfileAtom = atom<UserProfileState, [UserProfileState], void>(
  (get) => get(baseUserProfileAtom),
  (get, set, update) => {
    const { userId, displayName, avatarUrl, avatarModelUrl, avatarModelPreviewUrl } = get(baseUserProfileAtom);
    if (
      userId === update.userId &&
      avatarUrl === update.avatarUrl &&
      displayName === update.displayName &&
      avatarModelUrl === update.avatarModelUrl &&
      avatarModelPreviewUrl === update.avatarModelPreviewUrl
    ) {
      return;
    }

    set(baseUserProfileAtom, update);
  }
);
