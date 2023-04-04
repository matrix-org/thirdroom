#ifndef __websg_scene_js_h
#define __websg_scene_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGSceneData {
  WebSGWorldData *world_data;
  scene_id_t scene_id;
} WebSGSceneData;

extern JSClassID js_websg_scene_class_id;

void js_websg_define_scene(JSContext *ctx, JSValue websg);

JSValue js_websg_get_scene_by_id(JSContext *ctx, WebSGWorldData *world_data, scene_id_t scene_id);

JSValue js_websg_world_create_scene(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_scene_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
