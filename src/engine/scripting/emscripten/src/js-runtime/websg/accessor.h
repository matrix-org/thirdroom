#ifndef __websg_accessor_js_h
#define __websg_accessor_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

extern JSClassID js_websg_accessor_class_id;

typedef struct WebSGAccessorData {
  WebSGWorldData *world_data;
  accessor_id_t accessor_id;
} WebSGAccessorData;

void js_websg_define_accessor(JSContext *ctx, JSValue websg);

JSValue js_websg_get_accessor_by_id(JSContext *ctx, WebSGWorldData *world_data, accessor_id_t accessor_id);

JSValue js_websg_world_create_accessor_from(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_accessor_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
