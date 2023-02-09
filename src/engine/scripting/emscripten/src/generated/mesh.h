
#ifndef __mesh_h
#define __mesh_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_mesh_class_id;

JSValue create_mesh_from_ptr(JSContext *ctx, Mesh *mesh);

void js_define_mesh_api(JSContext *ctx, JSValue *target);

#endif