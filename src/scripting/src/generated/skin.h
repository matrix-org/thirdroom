
#ifndef __skin_h
#define __skin_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_skin_class_id;

JSValue create_skin_from_ptr(JSContext *ctx, Skin *skin);

void js_define_skin_api(JSContext *ctx, JSValue *target);

#endif