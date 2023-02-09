
#ifndef __image_h
#define __image_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_image_class_id;

JSValue create_image_from_ptr(JSContext *ctx, Image *image);

void js_define_image_api(JSContext *ctx, JSValue *target);

#endif