
#ifndef __material_h
#define __material_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_material_class_id;

JSValue create_material_from_ptr(JSContext *ctx, Material *material);

void js_define_material_api(JSContext *ctx, JSValue *target);

#endif