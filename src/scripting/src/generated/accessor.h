
#ifndef __accessor_h
#define __accessor_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_accessor_class_id;

JSValue create_accessor_from_ptr(JSContext *ctx, Accessor *accessor);

void js_define_accessor_api(JSContext *ctx, JSValue *target);

#endif