#ifndef __js_thirdroom_action_bar_h
#define __js_thirdroom_action_bar_h
#include "../quickjs/quickjs.h"

extern JSClassID js_thirdroom_action_bar_class_id;

void js_thirdroom_define_action_bar(JSContext *ctx, JSValue thirdroom);

JSValue js_thirdroom_new_action_bar(JSContext *ctx);

#endif
