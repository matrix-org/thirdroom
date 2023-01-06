
#ifndef __avatar_h
#define __avatar_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_avatar_class_id;

JSValue create_avatar_from_ptr(JSContext *ctx, Avatar *avatar);

void js_define_avatar_api(JSContext *ctx, JSValue *target);

#endif