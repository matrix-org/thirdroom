#ifndef __matrix_h
#define __matrix_h
#include <math.h>

#define import_matrix(NAME) __attribute__((import_module("matrix"),import_name(#NAME)))

typedef struct MatrixRequest {
  char* api;
  char* request_id;
  char* action;
  char* widget_id;
  char* data; // JSON encoded request data
} MatrixRequest;

typedef struct MatrixResponse {
  char* api;
  char* request_id;
  char* action;
  char* widget_id;
  int error; // Is the contents of response an error object?
  char* response; // JSON encoded response or error data
} MatrixResponse;

// Returns 0 if successful and -1 if there was an error.
import_matrix(send) int matrix_send(MatrixRequest *request);

// Returns the remaining number of responses. 0 if there are no remaining responses.
import_matrix(recv) int matrix_recv(MatrixResponse *response);

#endif