#include <string.h>

#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"

#include "../../thirdroom.h"
#include "../websg/image.h"

#include "./action-bar.h"
#include "./action-bar-listener.h"

JSClassID js_thirdroom_action_bar_class_id;

static JSClassDef js_thirdroom_action_bar_class = {
  "ActionBar"
};

static JSValue js_thirdroom_action_bar_set_items(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JSValue length_val = JS_GetPropertyStr(ctx, argv[0], "length");

  if (JS_IsException(length_val)) {
    return JS_EXCEPTION;
  }

  uint32_t count = 0;

  if (JS_ToUint32(ctx, &count, length_val) == -1) {
    return JS_EXCEPTION;
  }

  int error = 0;

  ThirdRoomActionBarItem *items = js_mallocz(ctx, count * sizeof(ThirdRoomActionBarItem));

  for (int i = 0; i < count; i++) {
    JSValue item = JS_GetPropertyUint32(ctx, argv[0], i);

    JSValue id_val = JS_GetPropertyStr(ctx, item, "id");

    if (JS_IsException(id_val)) {
      JS_ThrowInternalError(ctx, "WebSG: ActionBar item must have an id.");
      error = 1;
      break;
    }

    const char *id = JS_ToCString(ctx, id_val);

    if (id == NULL) {
      JS_ThrowInternalError(ctx, "WebSG: ActionBar item id must be a string.");
      error = 1;
      break;
    }

    items[i].id = id;

    JSValue label_val = JS_GetPropertyStr(ctx, item, "label");

    if (JS_IsException(label_val)) {
      JS_ThrowInternalError(ctx, "WebSG: ActionBar item must have a label.");
      error = 1;
      break;
    }

    const char *label = JS_ToCString(ctx, label_val);

    if (label == NULL) {
      JS_ThrowInternalError(ctx, "WebSG: ActionBar item label must be a string.");
      error = 1;
      break;
    }

    items[i].label = label;

    JSValue thumbnail_val = JS_GetPropertyStr(ctx, item, "thumbnail");

    if (JS_IsException(thumbnail_val)) {
      JS_ThrowInternalError(ctx, "WebSG: ActionBar item must have a thumbnail.");
      error = 1;
      break;
    }

    WebSGImageData *image_data = JS_GetOpaque2(ctx, thumbnail_val, js_websg_image_class_id);

    if (image_data == NULL) {
      JS_ThrowInternalError(ctx, "WebSG: ActionBar item thumbnail must be an image.");
      error = 1;
      break;
    }

    items[i].thumbnail_id = image_data->image_id;

  }

  if (error) {
    for (int i = 0; i < count; i++) {
      JS_FreeCString(ctx, items[i].id);
      JS_FreeCString(ctx, items[i].label);
    }

    js_free(ctx, items);

    return JS_EXCEPTION;
  }

  ThirdRoomActionBarItemList *item_list = js_mallocz(ctx, sizeof(ThirdRoomActionBarItemList));
  item_list->count = count;
  item_list->items = items;

  int32_t result = thirdroom_action_bar_set_items(item_list);

  for (int i = 0; i < count; i++) {
    JS_FreeCString(ctx, items[i].id);
    JS_FreeCString(ctx, items[i].label);
  }

  js_free(ctx, items);
  js_free(ctx, item_list);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "ThirdRoom: Error setting action bar items.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_thirdroom_action_bar_create_listener(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  return js_thirdroom_new_action_bar_listener(ctx);
}

static const JSCFunctionListEntry js_thirdroom_action_bar_funcs[] = {
  JS_CFUNC_DEF("setItems", 1, js_thirdroom_action_bar_set_items),
  JS_CFUNC_DEF("createListener", 0, js_thirdroom_action_bar_create_listener),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ActionBar", JS_PROP_CONFIGURABLE),
};

static JSValue js_thirdroom_action_bar_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_thirdroom_define_action_bar(JSContext *ctx, JSValue thirdroom) {
  JS_NewClassID(&js_thirdroom_action_bar_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_thirdroom_action_bar_class_id, &js_thirdroom_action_bar_class);
  JSValue action_bar = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, action_bar, js_thirdroom_action_bar_funcs, countof(js_thirdroom_action_bar_funcs));
  JS_SetClassProto(ctx, js_thirdroom_action_bar_class_id, action_bar);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_thirdroom_action_bar_constructor,
    "ActionBar",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, action_bar);
  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "ActionBar",
    constructor
  );
}

JSValue js_thirdroom_new_action_bar(JSContext *ctx) {
  JSValue action_bar = JS_NewObjectClass(ctx, js_thirdroom_action_bar_class_id);

  if (JS_IsException(action_bar)) {
    return action_bar;
  }

  return action_bar;
}
