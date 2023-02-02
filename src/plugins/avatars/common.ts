export interface AvatarOptions {
  radius?: number;
  height?: number;
  kinematic?: boolean;
  nametag?: boolean;
  collisionGroup?: number;
}

export const AVATAR_HEIGHT = 1.2;
export const AVATAR_OFFSET = -0.6;
// BUG?: avatar radius of 0.5 way too big for XR, 0.001 seems right
export const AVATAR_RADIUS = 0.001;
