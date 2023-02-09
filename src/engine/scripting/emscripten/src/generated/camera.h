
#ifndef __camera_h
#define __camera_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_camera_class_id;

JSValue create_camera_from_ptr(JSContext *ctx, Camera *camera);

void js_define_camera_api(JSContext *ctx, JSValue *target);

#endif