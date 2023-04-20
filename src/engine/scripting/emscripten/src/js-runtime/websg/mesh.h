#ifndef __websg_mesh_js_h
#define __websg_mesh_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

extern JSClassID js_websg_mesh_class_id;

typedef struct WebSGMeshData {
  WebSGWorldData *world_data;
  mesh_id_t mesh_id;
} WebSGMeshData;

void js_websg_define_mesh(JSContext *ctx, JSValue websg);

JSValue js_websg_get_mesh_by_id(JSContext *ctx, WebSGWorldData *world_data, mesh_id_t mesh_id);

JSValue js_websg_world_create_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_create_box_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_mesh_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
