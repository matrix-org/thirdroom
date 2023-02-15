#ifndef __matrix_h
#define __matrix_h
#include <stdint.h>

#define import_matrix(NAME) __attribute__((import_module("matrix"),import_name(#NAME)))

// Returns 0 if successful and -1 if there was an error.
import_matrix(listen) int32_t matrix_listen();

// Returns 0 if successful and -1 if there was an error.
import_matrix(close) int32_t matrix_close();

// Sends JSON encoded event from the provided buffer with the provided byte length
// Returns 0 if successful and -1 if there was an error.
import_matrix(send) int32_t matrix_send(const char *event, uint32_t byte_length);

// Gets the next event's byte length.
// Returns 0 if there is no event.
// Does not pop the event off the queue.
import_matrix(get_event_size) uint32_t matrix_get_event_size();

// Pops the most recent event off the queue and writes its JSON into the provided buffer
// Errors if event larger than max byte length.
// Returns the number of bytes written into the buffer. 0 if there was no event and -1 if there was an error.
import_matrix(receive) int32_t matrix_receive(
  const char *event,
  uint32_t max_byte_length
);

#endif
