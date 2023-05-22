#ifndef __js_thirdroom_action_bar_listener_h
#define __js_thirdroom_action_bar_listener_h
#include "../quickjs/quickjs.h"
#include "../../thirdroom.h"

typedef struct ActionBarListenerData {
  action_bar_listener_id_t listener_id;
} ActionBarListenerData;

extern JSClassID js_thirdroom_action_bar_listener_class_id;

void js_thirdroom_define_action_bar_listener(JSContext *ctx, JSValue thirdroom);

JSValue js_thirdroom_new_action_bar_listener(JSContext *ctx);

#endif
