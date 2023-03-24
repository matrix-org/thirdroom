#ifndef __websg_mesh_js_h
#define __websg_mesh_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

static JSClassID websg_mesh_class_id;

void js_define_websg_mesh(JSContext *ctx);

JSValue js_websg_create_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_find_mesh_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_get_mesh_by_id(JSContext *ctx, mesh_id_t mesh_id);

#endif
