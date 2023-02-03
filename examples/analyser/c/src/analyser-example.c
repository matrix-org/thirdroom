#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/scripting/src/generated/websg.h"
#include "../../../../src/scripting/src/thirdroom.h"

export void *websg_allocate(int size) {
  return malloc(size);
}

export void websg_deallocate(void *ptr) {
  free(ptr);
}

unsigned char *time_data[256] = {0};
unsigned char *frequency_data[256] = {0};

export void websg_loaded() {
}

export void websg_update(float_t dt) {
  thirdroom_get_audio_frequency_data(frequency_data);
}
