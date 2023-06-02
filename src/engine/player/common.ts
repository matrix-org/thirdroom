export interface AvatarOptions {
  radius?: number;
  height?: number;
  kinematic?: boolean;
  nametag?: boolean;
  collisionGroup?: number;
}

export const AVATAR_CAPSULE_HEIGHT = 1;
export const AVATAR_CAPSULE_RADIUS = 0.35;
export const AVATAR_HEIGHT = AVATAR_CAPSULE_HEIGHT + AVATAR_CAPSULE_RADIUS * 2;
export const AVATAR_CAMERA_OFFSET = 0.06;
