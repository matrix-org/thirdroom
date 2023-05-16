#ifndef __js_thirdroom_action_bar_iterator_h
#define __js_thirdroom_action_bar_iterator_h
#include "../quickjs/quickjs.h"
#include "./action-bar-listener.h"

typedef struct ActionBarIteratorData {
  ActionBarListenerData *listener_data;
} ActionBarIteratorData;

extern JSClassID js_thirdroom_action_bar_iterator_class_id;

void js_thirdroom_define_action_bar_iterator(JSContext *ctx);

JSValue js_thirdroom_create_action_bar_iterator(JSContext *ctx, ActionBarListenerData *listener_data);

#endif
