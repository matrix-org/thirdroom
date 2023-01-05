
#ifndef __environment_h
#define __environment_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_environment_class_id;

JSValue create_environment_from_ptr(JSContext *ctx, Environment *environment);

void js_define_environment_api(JSContext *ctx, JSValue *target);

#endif