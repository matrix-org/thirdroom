#ifndef __image_h
#define __image_h
#include "../include/quickjs/quickjs.h"
#include "./websg.h"

JSClassID js_image_class_id;

JSValue create_image_from_ptr(JSContext *ctx, Image *image);

Image *get_image_from_js_val(JSContext *ctx, JSValue image);

void js_define_image_api(JSContext *ctx, JSValue *target);

#endif