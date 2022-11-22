
#ifndef __instanced_mesh_h
#define __instanced_mesh_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_instanced_mesh_class_id;

JSValue create_instanced_mesh_from_ptr(JSContext *ctx, InstancedMesh *instanced_mesh);

void js_define_instanced_mesh_api(JSContext *ctx, JSValue *target);

#endif