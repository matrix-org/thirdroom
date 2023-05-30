#ifndef __websg_networking_h
#define __websg_networking_h
#include <math.h>
#include "./websg.h"

#define import_websg_networking(NAME) __attribute__((import_module("websg_networking"),import_name(#NAME)))

/*************
 * WebSG IDs *
 *************/
typedef uint32_t network_listener_id_t;
typedef uint32_t replicator_id_t;
typedef uint32_t replication_id_t;
typedef uint32_t network_id_t;

import_websg_networking(peer_get_id_length) int32_t websg_peer_get_id_length(uint32_t peer_index);
import_websg_networking(peer_get_id) int32_t websg_peer_get_id(uint32_t peer_index, const char *peer_id, size_t length);
import_websg_networking(peer_get_translation_element) float_t websg_peer_get_translation_element(uint32_t peer_index, uint32_t index);
import_websg_networking(peer_get_translation) int32_t websg_peer_get_translation(uint32_t peer_index, float_t *translation);
import_websg_networking(peer_get_rotation_element) float_t websg_peer_get_rotation_element(uint32_t peer_index, uint32_t index);
import_websg_networking(peer_get_rotation) int32_t websg_peer_get_rotation(uint32_t peer_index, float_t *rotation);
import_websg_networking(peer_is_host) int32_t websg_peer_is_host(uint32_t peer_index);
import_websg_networking(peer_is_local) int32_t websg_peer_is_local(uint32_t peer_index);
import_websg_networking(peer_send) int32_t websg_peer_send(uint32_t peer_index, uint8_t *packet, uint32_t byte_length, uint32_t binary, uint32_t reliable);

import_websg_networking(network_get_host_peer_index) uint32_t websg_network_get_host_peer_index();
import_websg_networking(network_get_local_peer_index) uint32_t websg_network_get_local_peer_index();
import_websg_networking(network_broadcast) int32_t websg_network_broadcast(uint8_t *packet, uint32_t byte_length, uint32_t binary, uint32_t reliable);

import_websg_networking(network_listen) network_listener_id_t websg_network_listen();
import_websg_networking(network_listener_close) int32_t websg_network_listener_close(network_listener_id_t listener_id);

typedef struct NetworkMessageInfo {
  uint32_t peer_index;
  uint32_t byte_length;
  int32_t binary;
} NetworkMessageInfo;

import_websg_networking(network_listener_get_message_info) int32_t websg_network_listener_get_message_info(network_listener_id_t listener_id, NetworkMessageInfo *info);

// Fills the provided write buffer with the next available network packet and pops it off the queue.
// Errors if packet larger than max byte length.
// Returns bytes written into the buffer. 0 if there was no packet and -1 if there was an error.
import_websg_networking(network_listener_receive) int32_t websg_network_listener_receive(
  network_listener_id_t listener_id,
  unsigned char *buffer,
  uint32_t max_byte_length
);

// Returns replicator ID if successful
// Returns -1 on error
import_websg_networking(define_replicator) replicator_id_t websg_network_define_replicator();

// adds/removes Networked+Owned components
import_websg_networking(replicator_spawn_local) int32_t websg_replicator_spawn_local(replicator_id_t replicator_id, node_id_t node_id, uint8_t *packet, uint32_t byte_length);
import_websg_networking(replicator_despawn_local) int32_t websg_replicator_despawn_local(replicator_id_t replicator_id, node_id_t node_id, uint8_t *packet, uint32_t byte_length);

// Returns the number of replications in the replicator's (de)spawned queue
import_websg_networking(replicator_spawned_count) int32_t websg_network_replicator_spawned_count(replicator_id_t replicator_id);
import_websg_networking(replicator_despawned_count) int32_t websg_network_replicator_despawned_count(replicator_id_t replicator_id);

typedef struct ReplicationInfo {
  node_id_t node_id; // Can be null when remote. Call factory if null.
  network_id_t network_id; // Can be null with local.
  uint32_t peer_index;
  uint32_t byte_length;
} ReplicationInfo;

import_websg_networking(replicator_get_spawned_message_info) int32_t websg_replicator_get_spawned_message_info(replicator_id_t replicator_id, ReplicationInfo *info);
import_websg_networking(replicator_get_despawned_message_info) int32_t websg_replicator_get_despawned_message_info(replicator_id_t replicator_id, ReplicationInfo *info);

// Returns a network ID popped from the replicator's (de)spawned queue
// Returns 0 if queue is empty
import_websg_networking(replicator_spawn_receive) uint32_t websg_replicator_spawn_receive(
  replicator_id_t replicator_id,
  unsigned char *buffer,
  uint32_t max_byte_length
);
import_websg_networking(replicator_despawn_receive) uint32_t websg_replicator_despawn_receive(
  replicator_id_t replicator_id,
  unsigned char *buffer,
  uint32_t max_byte_length
);

typedef struct NetworkSynchronizerProps {
  Extensions extensions;
  void *extras;
  network_id_t network_id;
  replicator_id_t replicator_id;
} NetworkSynchronizerProps;

// Returns 0 if successful
// Returns -1 on error
import_websg_networking(node_add_network_synchronizer) int32_t websg_node_add_network_synchronizer(node_id_t node_id,  NetworkSynchronizerProps *props);

#endif