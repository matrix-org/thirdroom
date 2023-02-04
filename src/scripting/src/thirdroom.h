#ifndef __thirdroom_h
#define __thirdroom_h
#include "../include/quickjs/quickjs.h"

#define import_thirdroom(NAME) __attribute__((import_module("thirdroom"),import_name(#NAME)))

import_thirdroom(enable_matrix_material) void thirdroom_enable_matrix_material(int enabled);

// Expects 256 byte array
import_thirdroom(get_audio_frequency_data) void thirdroom_get_audio_frequency_data(unsigned char *data);
import_thirdroom(get_audio_time_data) void thirdroom_get_audio_time_data(unsigned char *data);

void js_define_thirdroom_api(JSContext *ctx, JSValue *target);

#endif
