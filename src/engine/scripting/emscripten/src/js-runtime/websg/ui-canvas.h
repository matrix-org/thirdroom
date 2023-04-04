#ifndef __websg_ui_canvas_js_h
#define __websg_ui_canvas_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGUICanvasData {
  WebSGWorldData *world_data;
  ui_canvas_id_t ui_canvas_id;
} WebSGUICanvasData;

extern JSClassID js_websg_ui_canvas_class_id;

void js_websg_define_ui_canvas(JSContext *ctx, JSValue websg);

JSValue js_websg_get_ui_canvas_by_id(JSContext *ctx, WebSGWorldData *world_data, ui_canvas_id_t ui_canvas_id);

JSValue js_websg_world_create_ui_canvas(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_ui_canvas_by_name(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
);

#endif
