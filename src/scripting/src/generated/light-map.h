
#ifndef __light_map_h
#define __light_map_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_light_map_class_id;

JSValue create_light_map_from_ptr(JSContext *ctx, LightMap *light_map);

void js_define_light_map_api(JSContext *ctx, JSValue *target);

#endif