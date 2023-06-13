# Implementors Notes For Third Room Networking Protocol

The Third Room client is designed to be just one client in the larger Third Room ecosystem.
The Third Room engine uses the bitECS library and ECS design patterns to manage our network
lifecycle, state, and side effects. This document describes how we implement our networking
stack and some notes that may be helpful in implementing TRNP yourself.

### Authoritative Components

Three components are used to determine how the peer's simulation treats each networked entity.

- Networked
  - This component simply indicates that the entity exists as a networked entity.
  - Properties
    - networkID for the entity
    - the authoring peer's peerIndex (our own peerIndex if we are the authoring host)
    - schemaID for the entity
    - timestamp of last update
    - `destroyOnLeave` - whether or not the entity should be destroyed when the authoring peer leaves the simulation
- Authoring
  - This component indicates that the current peer's simulation is responsible for dictating source-of-truth updates about the entity. When this component is combined with Networked, it enters the [Network, Authoring] enter-query, which will cause the client to start sending out source-of-truth updates for an entity.
  - Enter Query [Networked, Authoring]
    - if we are the current host (if Networked.peerIndex is our peerIndex), we can safely send out a spawn across the network for this entity
    - if we are a new host being migrated to, the entity has spawned on the network already, therefore do not execute a spawn for this entity
  - Exit Query [Networked, Authoring]
    - if we are the current host (if Networked.peerIndex is our peerIndex), we can safely send out a despawn across the network for this entity
    - if we are a old host being migrated away from, we should not send a despawn across the network for this entity
- Relaying
  - This component indicates that this peer is hosting the simulation for this entity, but is only responsible for relaying the source-of-truth state for this entity which is being received by another peer who is authoring the source-of-truth for the entity
  - Holds the peerIndex of the peer who we are relaying the source-of-truth for

### Networked Object Lifecycle
