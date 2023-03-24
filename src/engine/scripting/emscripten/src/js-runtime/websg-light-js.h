#ifndef __websg_light_js_h
#define __websg_light_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

static JSClassID websg_light_class_id;

void js_define_websg_light(JSContext *ctx);

JSValue js_websg_create_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_find_light_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_get_light_by_id(JSContext *ctx, light_id_t light_id);

#endif
