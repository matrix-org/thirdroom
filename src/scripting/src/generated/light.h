
#ifndef __light_h
#define __light_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_light_class_id;

JSValue create_light_from_ptr(JSContext *ctx, Light *light);

void js_define_light_api(JSContext *ctx, JSValue *target);

#endif