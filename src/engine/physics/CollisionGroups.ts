export enum CollisionGroup {
  None = 0,
  Static = 1,
  Dynamic = 2,
  Player = 4,
  All = 65535,
}

let nextCollisionGroupIndex = Object.entries(CollisionGroup).filter(([k, v]) => typeof v === "number").length - 1;

/**
 * Register a new, user space, collision group.
 */
export function registerCollisionGroup(): number {
  if (nextCollisionGroupIndex >= 16) {
    throw new Error("Max collision groups exceeded");
  }

  return 2 ** nextCollisionGroupIndex++;
}

/**
 * @param membership The groups the collider is part of (should be a valid UInt16)
 * @param filter The groups the collider can interact with (should be a valid UInt16)
 */
export function constructCollisionGroups(membership: number, filter: number): number {
  return (membership << 16) + filter;
}

export function addCollisionGroupMembership(collisionGroups: number, membership: number): number {
  return collisionGroups | (membership << 16);
}

export function removeCollisionGroupMembership(collisionGroups: number, membership: number): number {
  return collisionGroups & ~(membership << 16);
}

export function addCollisionGroupFilter(collisionGroups: number, filter: number): number {
  return collisionGroups | filter;
}

// These are intended to be user space collision group identifiers and should eventually be moved to plugins
export const BoundsCollisionGroup = registerCollisionGroup();
export const FocusCollisionGroup = registerCollisionGroup();
export const GrabCollisionGroup = registerCollisionGroup();

export const staticRigidBodyCollisionGroups = constructCollisionGroups(
  CollisionGroup.Static,
  CollisionGroup.Dynamic | CollisionGroup.Player
);

// Focus / Grab collision filters added by addInteractableComponent
export const dynamicObjectCollisionGroups = constructCollisionGroups(
  CollisionGroup.Dynamic,
  CollisionGroup.Static | CollisionGroup.Dynamic | CollisionGroup.Player | BoundsCollisionGroup
);
export const playerCollisionGroups = constructCollisionGroups(
  CollisionGroup.Player,
  CollisionGroup.Static | CollisionGroup.Dynamic | BoundsCollisionGroup
);

export const boundsCheckCollisionGroups = constructCollisionGroups(BoundsCollisionGroup, CollisionGroup.All);
export const playerShapeCastCollisionGroups = constructCollisionGroups(
  CollisionGroup.All,
  CollisionGroup.Static | CollisionGroup.Dynamic
);
export const focusShapeCastCollisionGroups = constructCollisionGroups(CollisionGroup.All, FocusCollisionGroup);
export const grabShapeCastCollisionGroups = constructCollisionGroups(CollisionGroup.All, GrabCollisionGroup);
