#include <string.h>

#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../thirdroom.h"
#include "./action-bar-listener.h"
#include "./action-bar-iterator.h"

JSClassID js_thirdroom_action_bar_listener_class_id;

static JSClassDef js_thirdroom_action_bar_listener_class = {
  "ActionBarListener"
};

static JSValue js_thirdroom_action_bar_listener_actions(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ActionBarListenerData *listener_data = JS_GetOpaque(this_val, js_thirdroom_action_bar_listener_class_id);
  return js_thirdroom_create_action_bar_iterator(ctx, listener_data);
}

static JSValue js_thirdroom_action_bar_listener_dispose(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  ActionBarListenerData *data = JS_GetOpaque(this_val, js_thirdroom_action_bar_listener_class_id);
  
  if (thirdroom_action_bar_listener_dispose(data->listener_id) == -1) {
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_thirdroom_action_bar_listener_funcs[] = {
  JS_CFUNC_DEF("actions", 0, js_thirdroom_action_bar_listener_actions),
  JS_CFUNC_DEF("dispose", 0, js_thirdroom_action_bar_listener_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ActionBarListener", JS_PROP_CONFIGURABLE),
};

static JSValue js_thirdroom_action_bar_listener_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_thirdroom_define_action_bar_listener(JSContext *ctx, JSValue thirdroom) {
  JS_NewClassID(&js_thirdroom_action_bar_listener_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_thirdroom_action_bar_listener_class_id, &js_thirdroom_action_bar_listener_class);
  JSValue action_bar_listener = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, action_bar_listener, js_thirdroom_action_bar_listener_funcs, countof(js_thirdroom_action_bar_listener_funcs));
  JS_SetClassProto(ctx, js_thirdroom_action_bar_listener_class_id, action_bar_listener);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_thirdroom_action_bar_listener_constructor,
    "ActionBarListener",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, action_bar_listener);
  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "ActionBarListener",
    constructor
  );
}

JSValue js_thirdroom_new_action_bar_listener(JSContext *ctx) {
  JSValue action_bar_listener = JS_NewObjectClass(ctx, js_thirdroom_action_bar_listener_class_id);

  if (JS_IsException(action_bar_listener)) {
    return action_bar_listener;
  }

  ActionBarListenerData *listener_data = js_mallocz(ctx, sizeof(ActionBarListenerData));
  listener_data->listener_id = thirdroom_action_bar_create_listener();
  JS_SetOpaque(action_bar_listener, listener_data);

  return action_bar_listener;
}
