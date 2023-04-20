#ifndef __websg_mesh_primitive_js_h
#define __websg_mesh_primitive_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

extern JSClassID js_websg_mesh_primitive_class_id;

typedef struct WebSGMeshPrimitiveData {
  WebSGWorldData *world_data;
  mesh_id_t mesh_id;
  uint32_t index;
} WebSGMeshPrimitiveData;

MeshPrimitiveAttribute get_primitive_attribute_from_atom(JSAtom atom);

void js_websg_define_mesh_primitive(JSContext *ctx, JSValue websg);

JSValue js_websg_new_mesh_primitive_instance(
  JSContext *ctx,
  WebSGWorldData *world_data,
  mesh_id_t mesh_id,
  uint32_t index
);

#endif
