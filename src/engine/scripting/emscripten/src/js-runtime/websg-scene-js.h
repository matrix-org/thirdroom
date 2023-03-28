#ifndef __websg_scene_js_h
#define __websg_scene_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

typedef struct WebSGSceneData {
scene_id_t scene_id;
} WebSGSceneData;

static JSClassID websg_scene_class_id;

void js_define_websg_scene(JSContext *ctx);

JSValue js_websg_create_scene(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_find_scene_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_get_scene_by_id(JSContext *ctx, scene_id_t scene_id);

#endif
