# Third Room Network Protocol (TRNP)

## Network Lifecycle

### Connect

Client uses [host election algorithm](#host-election) to determine host among members in the Matrix Group Call.

Client waits to connect to host's `WebRTCPeerConnection` and ensures that the `RTCDataChannel` is open.

Wait for a `HostSnapshot` message from the host. Note you may receive messages from clients that are not the determined host. This could either be malicious or the result of the Matrix Room's state events not being up to date yet. If the message is from the host, set the local peer index to the `localPeerIndex` returned in the `HostSnapshot` message and the host peer index to the `hostPeerIndex`. If it is not from the host, store the message in case the current host changes. If the connection timeout happens before a `HostSnapshot` message is received stop waiting and show an error to the user and a button allowing them to try to reconnect.

### Disconnect

Member leaves or is disconnected from Matrix Group Call. This can happen when explicitly leaving the call or closing the browser tab or when the client loses internet connection or if the member was kicked from the call.

Dispose of all network entities and reset the network state.

### Peer Join

There will be separate behaviors when a new member has entered the call for the host and for other members on the call.

The host will assign a new peer index to the new member and send them a `HostSnapshot` message. The host will also send a `PeerJoin` message to all other members on the call. The host should also store a reference to the new member's `RTCDataChannel` and `MediaStream` objects referenced by their mxid.

Non-host members will not send any messages to other peers. They will only store a reference to the new member's `RTCDataChannel` and `MediaStream` objects referenced by their mxid.

New peers will not be eligible to be the host until they have received a `HostSnapshot` from the current host and have knowledge of the current peers on the call. Once they have received this message, they will be able to send their own `HostSnapshot` messages to the other peers on the call.

### Peer Left

There will be separate behaviors when a member has left the call for the host and for other members on the call.

The host will remove the peer from the list of peers and send a `PeerLeft` message to all other members on the call. The host should also remove the reference to the peer's `RTCDataChannel` and `MediaStream` objects referenced by their mxid.

Non-host members will not send any messages to other peers. They will only remove the reference to the peer's `RTCDataChannel` and `MediaStream` objects referenced by their mxid.

If the leaving peer was the current host, elect a new host based on the current known peers on the call and the [host election algorithm](#host-election). If we are not the new host, wait for a `HostSnapshot` message. If we are the new host, send a `HostSnapshot` message to all other members on the call.

## Host Election

Pinned hosts can be set on a world and if set, are the only allowed hosts in the order specified.
Pinned hosts are specified as an array of mxids on the `m.world` state event.

Next, power level is used to determine the host. Members in the highest power level are sorted based on how long they have been in the call based on the `m.call.member` event. If there is still a tie, the member with the lowest mxid is chosen.

## Host Migration

During host migration, all clients should disable any systems with side-effects (aside from networking) and display a host migration modal to the user.

If we are determined to be the new host, we should immediately send a `HostSnapshot` message to all connected peers. We can then resume the simulation.

If we're not the host we should wait until we receive a `HostSnapshot` from the determined host. If a `HostSnapshot` message from a peer that is not determined to be the current host is received, store this message in case the current host changes. If the connection timeout happens before a `HostSnapshot` message is received stop waiting and show an error to the user and a button allowing them to try to reconnect.

## Network Identifiers

### Network ID

These are monotonically increasing 64 bit unsigned integers that is assigned to each spawned networked entity. They are used to identify entities across the network. Network IDs are assigned by the host and never reused.

### Peer Index

These are monotonically increasing 64 bit unsigned integers that are assigned to each peer that is connected to the host. They are used to identify peers across the network. Peer indices are assigned by the host and never reused.

## Network Messages

```c
enum NetworkMessageType {
  HostSnapshot = 0
  PeerJoin = 1
  PeerLeft = 2
  SpawnDespawnRPC = 3
  EntityUpdates = 4
}

struct PeerInfo {
  peerIndex: uint64
  peerIdLength: uint32
  peerId: char[peerIdLength]
}

struct Spawn {
  networkId: uint64
  schemaId: uint32
  creationData: uint8[]
  updateData: uint8[]
}

struct Despawn {
  networkId: uint64 // The network id of the spawned node
}

struct Update {
  networkId: uint64 // The network id of the spawned node
  bitmask: uint8/16/32 // a bitmask indicating which properties of the schema are included in this update
  data: uint8[] // The update data
}

struct RPC {
  type: uint32 // The RPC type
  data: uint8[] // The RPC data, unique to each RPC type (note script RPC should send a byte length for data so that we properly deserialize the full data array)
}

// reliable & ordered
message HostSnapshot {
  type: NetworkMessageType.HostSnapshot
  hostTime: uint64
  localPeerIndex: uint64
  hostPeerIndex: uint64
  peerCount: uint32
  peers: PeerInfo[peerCount]
  entityCount: uint32
  entitySpawns: Spawn[entityCount]
}

// reliable & ordered
message PeerJoin {
  type: NetworkMessageType.PeerJoin
  peerInfo: PeerInfo
}

// reliable & ordered
message PeerLeft {
  type: NetworkMessageType.PeerLeft
  peerIndex: uint64
}

// reliable & ordered
message SpawnDespawnRPC {
  type: NetworkMessageType.SpawnDespawn

  spawnCount: uint32 // enterQuery.length
  spawns: Spawn[entitySpawnCount]

  despawnCount: uint32 // exitQuery.length
  despawns: Despawn[entityDespawnCount]

  rpcCount: uint32 // rpcs.length
  rpcs: RPC[rpcCount]
}

// unreliable & unordered
message EntityUpdates {
  type: NetworkMessageType.Update
  time: uint64 // The time of the update

  updateCount: uint32 // query.length
  updates: Update[updateCount]
}
```

### Structs vs Messages

Structs are schemas for the shape of the data in binary. They are encoded in the order that the properties are specified in. Messages contain one or more of these encoded structs.

### Structs

- NetworkMessageType

  - An enumeration of the different types of messages that can be passed around in this network protocol. This includes the HostSnapshot, PeerJoin, PeerLeft, SpawnDespawnRPC, and EntityUpdates message types. There is a reserved range of enum integer representations for internal message types. Other message types can be defined by users using integer ranges outside of the internally reserved range.

- PeerInfo

  - This struct holds information about a peer in the network. It contains an index, the length of a peer's ID, and the ID itself, which is an mxid provided by Hydrogen.

- Spawn

  - This struct is used to spawn entities in the game world. It contains the network ID of the entity, a schema ID indicating the type of entity being spawned, and two byte arrays holding the creation and update data for the entity.

- Despawn

  - The Despawn struct is used to remove entities from the game world. It only needs the network ID of the entity to be despawned.

- Update

  - This struct contains an entity's network ID, a bitmask specifying which properties of the schema (inferred via networkID) are included in this update, and a byte array with the update data.

- RPC (Remote Procedure Call)

  - This struct is used for sending remote procedure calls. It contains an identifier for the type of RPC and a byte array containing the data unique to each RPC type.

### Messages

- HostSnapshot

  - This message is reliably and orderedly sent from the host to the peers. It contains the host's time, the host's peer index, the local peer index for the receiving client, a count of peers, the peers' information, a count of entities, and the entity spawn information.
  - Contains arrays of Spawn and Update structs

- PeerJoin

  - This message is reliably and orderedly sent when a new peer joins the network. It contains the new peer's information.
  - Contains PeerInfo struct

- PeerLeft

  - This message is reliably and orderedly sent when a peer leaves the network. It contains the index of the peer that has left.
  - Contains no structs, just a peerIndex

- SpawnDespawnRPC

  - This message is reliably and orderedly sent to spawn and despawn entities and make remote procedure calls. It contains counts and data for the spawns, despawns, and RPCs.
  - Contains arrays of Spawn, Despawn, and RPC structs

- EntityUpdates

  - This message is sent unreliably and unordered to update entities. It contains the time of the update, a count of updates, and the updates themselves.
  - Contains array of Update struct

## Authority

A peer having authority over an entity means that the peer is solely responsible for establishing the source-of-truth for that entity's state. By default, the host will have authority over all networked entities in the simulation **except for other peer's avatars**. Having peers send source-of-truth updates about their avatar is known as client-authority. When a non-host peer interacts with an entity that they do not have authority over, such as picking up an entity and moving it around, the peer obtains a temporary authority lock on the entity. The host will cease having authoritative simulation control over the entity, but will still be responsible for relaying the entity's source-of-truth. When the peer stops actively interacting with the entity, authority is relinquished by the peer back to the host.

### Authoritative Components

Three components are used to determine how the peer's simulation treats each networked entity.

- Networked
  - This component simply indicates that the entity exists as a networked entity.
  - Holds the networkID for the entity
  - Holds the authoring peer's peerIndex (our own peerIndex if we are the authoring host)
- Authoring
  - This component indicates that the current peer's simulation is responsible for dictating source-of-truth updates about the entity. When this component is combined with Networked, it will cause the client to start sending out source-of-truth updates for an entity.
- Relaying
  - This component indicates that this peer is hosting the simulation for this entity, but is only responsible for relaying the source-of-truth state for this entity which is being received by another peer who is authoring the source-of-truth for the entity
  - Holds the peerIndex of the peer who we are relaying the source-of-truth for
