
#ifndef __buffer_h
#define __buffer_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_buffer_class_id;

JSValue create_buffer_from_ptr(JSContext *ctx, Buffer *buffer);

void js_define_buffer_api(JSContext *ctx, JSValue *target);

#endif