#ifndef __websg_texture_js_h
#define __websg_texture_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGTextureData {
  WebSGWorldData *world_data;
  texture_id_t texture_id;
} WebSGTextureData;

extern JSClassID js_websg_texture_class_id;

void js_websg_define_texture(JSContext *ctx, JSValue websg);

JSValue js_websg_get_texture_by_id(JSContext *ctx, WebSGWorldData *world_data, texture_id_t texture_id);

JSValue js_websg_world_find_texture_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
