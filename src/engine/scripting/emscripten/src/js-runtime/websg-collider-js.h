#ifndef __websg_collider_js_h
#define __websg_collider_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

static JSClassID websg_collider_class_id;

void js_define_websg_collider(JSContext *ctx);

JSValue js_websg_create_collider(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_find_collider_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_get_collider_by_id(JSContext *ctx, collider_id_t collider_id);

#endif
