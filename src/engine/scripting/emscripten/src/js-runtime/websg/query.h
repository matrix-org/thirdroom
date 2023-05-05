#ifndef __websg_query_js_h
#define __websg_query_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGQueryData {
  WebSGWorldData *world_data;
  query_id_t query_id;
} WebSGQueryData;


extern JSClassID js_websg_query_class_id;

void js_websg_define_query(JSContext *ctx, JSValue websg);

JSValue js_websg_world_create_query(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
