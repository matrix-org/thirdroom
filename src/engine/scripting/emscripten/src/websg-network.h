#ifndef __websg_network_h
#define __websg_network_h
#include <math.h>

#define import_websg_network(NAME) __attribute__((import_module("websg_network"),import_name(#NAME)))

// Returns 0 if successful and -1 if there was an error.
import_websg_network(listen) int32_t websg_network_listen();

// Returns 0 if successful and -1 if there was an error.
import_websg_network(close) int32_t websg_network_close();

// Returns 0 if successful and -1 if there was an error.
import_websg_network(broadcast) int32_t websg_network_broadcast(uint8_t *packet, uint32_t byte_length);

// Gets the next packet's byte length.
// Returns 0 if there is no packet.
// Does not pop the packet off the queue.
import_websg_network(get_packet_size) uint32_t websg_network_get_packet_size();

// Fills the provided write buffer with the next available network packet and pops it off the queue.
// Errors if packet larger than max byte length.
// Returns bytes written into the buffer. 0 if there was no packet and -1 if there was an error.
import_websg_network(receive) int32_t websg_network_receive(
  unsigned char *buffer,
  uint32_t max_byte_length
);

#endif