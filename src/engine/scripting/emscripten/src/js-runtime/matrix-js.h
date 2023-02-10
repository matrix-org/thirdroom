#ifndef __matrix_js_h
#define __matrix_js_h
#include "./quickjs/quickjs.h"

void js_define_matrix_api(JSContext *ctx, JSValue *target);

#endif