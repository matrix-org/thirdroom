#ifndef __websg_ui_flex_js_h
#define __websg_ui_flex_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGUIFlexData {
  WebSGWorldData *world_data;
  ui_flex_id_t ui_flex_id;
} WebSGUIFlexData;

static JSClassID js_websg_ui_flex_class_id;

void js_websg_define_ui_flex(JSContext *ctx, JSValue websg);

JSValue js_websg_get_ui_flex_by_id(JSContext *ctx, WebSGWorldData *world_data, ui_flex_id_t ui_flex_id);

JSValue js_websg_world_create_ui_flex(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
