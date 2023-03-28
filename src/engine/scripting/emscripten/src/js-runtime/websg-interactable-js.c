#include "../websg.h"
#include "./js-utils.h"
#include "./quickjs/quickjs.h"
#include "./websg-node-js.h"
#include "./websg-interactable-js.h"

static void js_websg_interactable_finalizer(JSRuntime *rt, JSValue val) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(val, websg_interactable_class_id);

  if (interactable_data) {
    js_free_rt(rt, interactable_data);
  }
}

static JSClassDef websg_interactable_class = {
  "WebSGInteractable",
  .finalizer = js_websg_interactable_finalizer
};

static const JSCFunctionListEntry websg_interactable_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGInteractable", JS_PROP_CONFIGURABLE),
};

void js_define_websg_interactable(JSContext *ctx) {
  JS_NewClassID(&websg_interactable_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_interactable_class_id, &websg_interactable_class);
  JSValue interactable_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    interactable_proto,
    websg_interactable_proto_funcs,
    countof(websg_interactable_proto_funcs)
  );
  JS_SetClassProto(ctx, websg_interactable_class_id, interactable_proto);
}

static JSValue js_websg_node_add_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  // TODO: Add more types of interactables and make the interactable type optional with this as the default
  int32_t result = websg_add_interactable(node_data->node_id, InteractableType_Interactable);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error adding interactable.");
    return JS_EXCEPTION;
  }

  JSValue interactable = JS_NewObjectClass(ctx, websg_interactable_class_id);

  if (JS_IsException(interactable)) {
    return interactable;
  }

  WebSGInteractableData *interactable_data = js_mallocz(ctx, sizeof(WebSGInteractableData));

  JS_SetOpaque(interactable, interactable_data);

  node_data->interactable = interactable;

  return interactable;
}

static JSValue js_websg_node_remove_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  int32_t result = websg_remove_interactable(node_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error removing interactable.");
    return JS_EXCEPTION;
  }

  JS_FreeValue(ctx, node_data->interactable);

  node_data->interactable = JS_UNDEFINED;

  return JS_UNDEFINED;
}

static JSValue js_websg_node_has_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  int32_t result = websg_has_interactable(node_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error checking for interactable.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_node_get_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  if (websg_has_interactable(node_data->node_id) && JS_IsUndefined(node_data->interactable)) {
    JSValue interactable = JS_NewObjectClass(ctx, websg_interactable_class_id);

    if (JS_IsException(interactable)) {
      return interactable;
    }

    WebSGInteractableData *interactable_data = js_mallocz(ctx, sizeof(WebSGInteractableData));
    interactable_data->node_id = node_data->node_id;

    JS_SetOpaque(interactable, interactable_data);

    node_data->interactable = interactable;

    return node_data->interactable;
  }

  return JS_DupValue(ctx, node_data->interactable);
}

static JSValue js_websg_interactable_pressed(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(this_val, websg_interactable_class_id);

  int32_t result = websg_get_interactable_pressed(interactable_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable pressed state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_interactable_held(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(this_val, websg_interactable_class_id);

  int32_t result = websg_get_interactable_held(interactable_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable held state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_interactable_released(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(this_val, websg_interactable_class_id);

  int32_t result = websg_get_interactable_released(interactable_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable released state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}
