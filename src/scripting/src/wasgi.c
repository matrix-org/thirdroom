#include <stdlib.h>
#include "wasgi.h"

export void *allocate(int size) {
  return malloc(size);
}

export void deallocate(void *ptr) {
  free(ptr);
}