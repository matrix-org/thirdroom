#ifndef __websg_ui_element_js_h
#define __websg_ui_element_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGUIElementData {
  WebSGWorldData *world_data;
  ui_element_id_t ui_element_id;
} WebSGUIElementData;

extern JSClassID js_websg_ui_element_class_id;

void js_websg_define_ui_element(JSContext *ctx, JSValue websg);

JSValue js_websg_get_ui_element_by_id(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t ui_element_id);

JSValue js_websg_world_create_ui_element(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_ui_element_by_name(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
);

#endif
