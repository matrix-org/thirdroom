# Thirdroom Network Protocol

## Version 1

This protocol uses one bi-directional, reliable, ordered datachannel per peer. All messages are binary and use the format specified below.

## Identity Layer

#### Member IDs (MID) and Member Entity ID (MEID)

Member identities are any globally unique identifier. In our examples we'll be using Matrix IDs for member identifiers, but they could be anthing that's globally unique per member.

Member entity ids are a local 32 bit unsigned integer representation of member identities. Member entity ids can be any locally unique uint32. In our implementation we'll be using bitECS entity ids for our Member Entity Ids.

Every client keeps a map of member identities to member entity ids:

```js
const localMIDToMEIDMap = {
  "@bob:matrix.org": 72,
  "@alice:matrix.org": 96,
};
```

Outbound network messages should include data using your local MEIDs. When sending a message with a local MEID that has not yet been communicated to the remote member, you must also send a mapping of MID to local MEID. When a remote datachannel closes or the member leaves, be sure to clear this mapping so that the MID to MEID mapping is re-advertized.

```
// TODO: specify outbound peer id to peer index map
```

Inbound network messages will include remote MEIDs. These remote MEIDs should be resolved to local MEIDs using the included mapping of MID to remote MEID.

```ts
type MID = string;
type LocalMEID = number;
type RemoteMEID = number;

interface IncomingMessage {
  sender: MID;
  data: ArrayBuffer;
}

interface DecodedMessage {
  remoteMIDToMEIDMap: Map<MID, RemoteMEID>;
}

const localMEIDMap: Map<MID, LocalMEID> = new Map();
const remoteMEIDMap: Map<LocalMEID, Map<RemoteMEID, LocalMEID>> = new Map();

function onMessage(message: IncomingMessage) {
  const senderLocalMEID = localMEIDMap.get(message.sender);
  const { remoteMIDToMEIDMap, } = decodeRemoteMessage(message.data): DecodedMessage;

  if (!remoteMEIDMap.has(senderLocalMEID)) {
    remoteMEIDMap.set(new Map());
  }

  const senderRemoteMEIDToMIDMap = remoteMEIDMap.get(senderLocalMEID);

  for (const [memberMID, memberRemoteMEID] of remoteMIDToMEIDMap) {
    const memberLocalMEID = localMEIDMap.get(memberMID);
    senderRemoteMEIDToMIDMap.set(memberRemoteMEID, memberLocalMEID);
  }

  // use senderRemoteMEIDToMIDMap to map incoming message's remote MEIDs to our local MEIDs
  rewriteRemoteMEIDToLocalMEID(message.data);
}
```

#### Entity IDs (EID) and Remote Entity IDs (REID)

Third Room is built around an entity component system architecture. While clients are not required to build with ECS, our network protocol adopts some of the concepts from it. Entities (EID) are represented as unique unsigned 32 bit integers. Our local client and other member's clients will not have synchronized entity ids. So when referring to entities on another member's client, we use the term remote entity id (REID).

MIDs and MEIDs refer to **who** is sending data and owning entities. EIDs and REIDs refer to **what** is being created, updated, and removed.

Just like with MIDs and MEIDs. Remote entities will need a mapping to local entities. When we receive an entity creation command or a snapshot command it will contain one or more remote entity ids. We create and assign a new local entity id for each and store a mapping of REID to EID for decoding update and deletion commands.

## Next Steps

- Identity Layer
  - Who and what
  - Mostly specified above
- Ownership Layer
  - Can I/they add / update / delete this?
- Synchronization Layer
  - Data and time
  - Decide where property synchronization, command-based synchronization, and input synchronization methods are used. Are we using lockstep networking or snapshot interpolation?
