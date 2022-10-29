#ifndef __console_h
#define __console_h
#include "../include/quickjs/quickjs.h"

void js_define_console_api(JSContext *ctx, JSValue *target);

#endif
