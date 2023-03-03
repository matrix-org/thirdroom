import { atom } from "jotai";

interface UserProfileState {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

const baseUserProfileAtom = atom<UserProfileState>({
  userId: "@dummy:server.xyz",
  displayName: "dummy",
  avatarUrl: undefined,
});

export const userProfileAtom = atom<UserProfileState, [UserProfileState], void>(
  (get) => get(baseUserProfileAtom),
  (get, set, update) => {
    const { userId, displayName, avatarUrl } = get(baseUserProfileAtom);
    if (userId === update.userId && avatarUrl === update.avatarUrl && displayName === update.displayName) return;
    set(baseUserProfileAtom, update);
  }
);
