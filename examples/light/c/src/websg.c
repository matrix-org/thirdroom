#include <stdlib.h>
#include "websg.h"

export void *websg_allocate(int size) {
  return malloc(size);
}

export void websg_deallocate(void *ptr) {
  free(ptr);
}