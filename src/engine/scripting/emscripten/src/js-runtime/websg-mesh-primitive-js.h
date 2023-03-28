#ifndef __websg_mesh_primitive_js_h
#define __websg_mesh_primitive_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

static JSClassID websg_mesh_primitive_class_id;

typedef struct WebSGMeshPrimitiveData {
  mesh_id_t mesh_id;
  uint32_t index;
} WebSGMeshPrimitiveData;

void js_define_websg_mesh_primitive(JSContext *ctx);

JSValue js_websg_new_mesh_primitive_instance(JSContext *ctx, WebSGContext *websg, mesh_id_t mesh_id, uint32_t index);

#endif
