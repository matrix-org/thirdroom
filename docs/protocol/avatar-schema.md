# Avatar Network Schema

```c
struct Spawn {
  networkId: uint64 // The avatar's networkId
  authorIndex: uint64 // Who controls the avatar
  schemaId: uint32 // 1 (Reserved Avatar schema id)
  creationDataByteLength: uint32 // 0
  creationData: uint8[] // not used
  updateData: AvatarUpdate
}

struct AvatarUpdate {
  changedBitmask: uint8_t // rigPosition, rigRotation, rigVelocity
  rigPosition: float_t[3]
  rigRotation: float_t[4]
  rigVelocity: float_t[3]
}

struct AvatarXRModeUpdate {
  xrMode: uint8_t
}
```

```js
const avatarReplicator = createNetworkedReplicator({
  spawn(world, { author, creationData, updateData, networked }) {
    // Create node in world
    // Should be controllable by author
    // Return node to spawn
    return avatarRoot;
  },
  encode(node, buffer) {
    // Write to buffer, return number bytes written, buffer truncated to that length and written as updateData
  },
  decode(node, buffer) {
    // Read from buffer and apply to node or interp buffer
    const interpBuffer = interpMap.get(node);
    interpBuffer.add();
  },
});

// host
if (host) {
  const node = avatarReplicator.spawn(creationData, { destroyOnLeave: true });
  // Modify the node as needed and that update data will be sent with the first spawn message
}

avatarReplicator.despawn(node);

for (const { node } of avatarReplicator.spawned()) {
  // Spawned nodes should have the latest update data applied to them if it exists,
  // not just the original spawn update data
  world.environment.addNode(node);
}

for (const node of avatarReplicator.despawned()) {
  world.environment.removeNode(node);
}
```
