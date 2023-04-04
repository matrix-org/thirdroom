#ifndef __websg_material_js_h
#define __websg_material_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

extern JSClassID js_websg_material_class_id;

typedef struct WebSGMaterialData {
  WebSGWorldData *world_data;
  material_id_t material_id;
} WebSGMaterialData;

void js_websg_define_material(JSContext *ctx, JSValue websg);

JSValue js_websg_get_material_by_id(JSContext *ctx, WebSGWorldData *world_data, material_id_t material_id);

JSValue js_websg_world_create_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_create_unlit_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_material_by_name(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
);

#endif
