#ifndef __matrix_h
#define __matrix_h
#include <math.h>

#define import_matrix(NAME) __attribute__((import_module("matrix"),import_name(#NAME)))

// Returns 0 if successful and -1 if there was an error.
import_matrix(send_widget_message) int matrix_send_widget_message(const char *message);

// Returns a pointer to the JSON encoded widget message or a null pointer if we've processed all messages.
import_matrix(receive_widget_message) char *matrix_receive_widget_message();

#endif