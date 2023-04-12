#ifndef __websg_ui_text_js_h
#define __websg_ui_text_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

extern JSClassID js_websg_ui_text_class_id;

void js_websg_define_ui_text(JSContext *ctx, JSValue websg);

JSValue js_websg_world_create_ui_text(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_new_ui_text_instance(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t ui_element_id);

#endif