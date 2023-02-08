#ifndef __websg_network_h
#define __websg_network_h
#include <math.h>

#define import_websg_network(NAME) __attribute__((import_module("websg_network"),import_name(#NAME)))

// Returns 0 if successful and -1 if there was an error.
import_websg_network(network_broadcast) int websg_network_broadcast(unsigned char *packet, int length);

// Fills the provided write buffer with the next available network packet, errors if packet larger than buffer size
// Returns 1 if message received, 0 if no message received, and -1 if there was an error.
import_websg_network(network_receive) int websg_network_receive(unsigned char *writeBuffer, int max);

#endif