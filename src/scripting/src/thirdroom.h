#ifndef __thirdroom_h
#define __thirdroom_h
#include "../include/quickjs/quickjs.h"

#define import_thirdroom(NAME) __attribute__((import_module("thirdroom"),import_name(#NAME)))

import_thirdroom(enable_matrix_material) void thirdroom_enable_matrix_material(int enabled);

void js_define_thirdroom_api(JSContext *ctx, JSValue *target);

#endif
