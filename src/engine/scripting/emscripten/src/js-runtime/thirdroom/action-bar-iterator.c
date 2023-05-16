#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./action-bar-iterator.h"

JSClassID js_thirdroom_action_bar_iterator_class_id;

static void js_thirdroom_action_bar_iterator_finalizer(JSRuntime *rt, JSValue val) {
  ActionBarIteratorData *it = JS_GetOpaque(val, js_thirdroom_action_bar_iterator_class_id);

  if (it) {
    js_free_rt(rt, it);
  }
}

static JSClassDef js_thirdroom_action_bar_iterator_class = {
  "ActionBarIterator",
  .finalizer = js_thirdroom_action_bar_iterator_finalizer
};

static JSValue js_thirdroom_action_bar_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  ActionBarIteratorData *it = JS_GetOpaque2(ctx, this_val, js_thirdroom_action_bar_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  int32_t action_length = thirdroom_action_bar_listener_get_next_action_length(it->listener_data->listener_id);

  if (action_length == 0) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  } else if (action_length == -1) {
    *pdone = FALSE;
    JS_ThrowInternalError(ctx, "Error getting next action length");
    return JS_EXCEPTION;
  }

  *pdone = FALSE;

  const char *action = js_mallocz(ctx, action_length);

  if (thirdroom_action_bar_listener_get_next_action(it->listener_data->listener_id, action) == -1) {
    *pdone = FALSE;
    JS_ThrowInternalError(ctx, "Error getting next action");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, action, action_length);
}

static JSValue js_thirdroom_action_bar_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}


static const JSCFunctionListEntry js_thirdroom_action_bar_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_thirdroom_action_bar_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ActionBarIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_thirdroom_action_bar_iterator),
};

void js_thirdroom_define_action_bar_iterator(JSContext *ctx) {
  JS_NewClassID(&js_thirdroom_action_bar_iterator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_thirdroom_action_bar_iterator_class_id, &js_thirdroom_action_bar_iterator_class);
  JSValue proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    proto,
    js_thirdroom_action_bar_iterator_proto_funcs,
    countof(js_thirdroom_action_bar_iterator_proto_funcs)
  );
  JS_SetClassProto(ctx, js_thirdroom_action_bar_iterator_class_id, proto);
}

JSValue js_thirdroom_create_action_bar_iterator(JSContext *ctx, ActionBarListenerData *listener_data) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_thirdroom_action_bar_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  ActionBarIteratorData *it = js_mallocz(ctx, sizeof(ActionBarIteratorData));

  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  it->listener_data = listener_data;

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}