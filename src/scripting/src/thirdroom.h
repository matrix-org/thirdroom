#ifndef __thirdroom_h
#define __thirdroom_h
#include "../include/quickjs/quickjs.h"

#define import_thirdroom(NAME) __attribute__((import_module("thirdroom"),import_name(#NAME)))

import_thirdroom(enable_matrix_material) void thirdroom_enable_matrix_material(int enabled);

import_thirdroom(get_audio_frequency_data) void thirdroom_get_audio_frequency_data(unsigned char *data[256]);

void js_define_thirdroom_api(JSContext *ctx, JSValue *target);

#endif
