#ifndef __websg_light_js_h
#define __websg_light_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGLightData {
  WebSGWorldData *world_data;
  light_id_t light_id;
} WebSGLightData;

extern JSClassID js_websg_light_class_id;

void js_websg_define_light(JSContext *ctx, JSValue websg);

JSValue js_websg_get_light_by_id(JSContext *ctx, WebSGWorldData *world_data, light_id_t light_id);

JSValue js_websg_world_create_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_light_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
