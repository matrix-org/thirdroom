#ifndef __websg_world_js_h
#define __websg_world_js_h
#include "./quickjs/quickjs.h"

static JSClassID websg_world_class_id;

void js_define_websg_world(JSContext *ctx);

JSValue js_new_websg_world(JSContext *ctx);

#endif
