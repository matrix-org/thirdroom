
#ifndef __reflection_probe_h
#define __reflection_probe_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_reflection_probe_class_id;

JSValue create_reflection_probe_from_ptr(JSContext *ctx, ReflectionProbe *reflection_probe);

void js_define_reflection_probe_api(JSContext *ctx, JSValue *target);

#endif