#ifndef __websg_image_js_h
#define __websg_image_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGImageData {
  WebSGWorldData *world_data;
  image_id_t image_id;
} WebSGImageData;

extern JSClassID js_websg_image_class_id;

void js_websg_define_image(JSContext *ctx, JSValue websg);

JSValue js_websg_get_image_by_id(JSContext *ctx, WebSGWorldData *world_data, image_id_t image_id);

JSValue js_websg_world_find_image_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
