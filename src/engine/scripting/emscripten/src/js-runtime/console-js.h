#ifndef __console_h
#define __console_h
#include "./quickjs/quickjs.h"

void js_define_console_api(JSContext *ctx, JSValue *target);
void js_log_error(JSContext *ctx, JSValue *error);

#endif
