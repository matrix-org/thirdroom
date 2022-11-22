
#ifndef __buffer_view_h
#define __buffer_view_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_buffer_view_class_id;

JSValue create_buffer_view_from_ptr(JSContext *ctx, BufferView *buffer_view);

void js_define_buffer_view_api(JSContext *ctx, JSValue *target);

#endif