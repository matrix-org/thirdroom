#ifndef __websg_networking_h
#define __websg_networking_h
#include <math.h>

#define import_websg_networking(NAME) __attribute__((import_module("websg_networking"),import_name(#NAME)))

/*************
 * WebSG IDs *
 *************/
typedef uint32_t network_listener_id_t;

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

#endif