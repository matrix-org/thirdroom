
#ifndef __mesh_primitive_h
#define __mesh_primitive_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_mesh_primitive_class_id;

JSValue create_mesh_primitive_from_ptr(JSContext *ctx, MeshPrimitive *mesh_primitive);

void js_define_mesh_primitive_api(JSContext *ctx, JSValue *target);

#endif