#ifndef __websg_collider_js_h
#define __websg_collider_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGColliderData {
  WebSGWorldData *world_data;
  collider_id_t collider_id;
} WebSGColliderData;


extern JSClassID js_websg_collider_class_id;

void js_websg_define_collider(JSContext *ctx, JSValue websg);

JSValue js_websg_get_collider_by_id(JSContext *ctx, WebSGWorldData *world_data, collider_id_t collider_id);

JSValue js_websg_world_create_collider(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_collider_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
