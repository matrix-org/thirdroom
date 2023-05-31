#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./node.h"
#include "./interactable.h"

JSClassID js_websg_interactable_class_id;

JSAtom interactable_type_interactable;
JSAtom interactable_type_grabbable;

/**
 * Class Definition
 **/

static void js_websg_interactable_finalizer(JSRuntime *rt, JSValue val) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(val, js_websg_interactable_class_id);

  if (interactable_data) {
    js_free_rt(rt, interactable_data);
  }
}

static JSClassDef js_websg_interactable_class = {
  "Interactable",
  .finalizer = js_websg_interactable_finalizer
};

static JSValue js_websg_interactable_pressed(JSContext *ctx, JSValueConst this_val) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(this_val, js_websg_interactable_class_id);

  int32_t result = websg_node_get_interactable_pressed(interactable_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable pressed state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_interactable_held(JSContext *ctx, JSValueConst this_val) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(this_val, js_websg_interactable_class_id);

  int32_t result = websg_node_get_interactable_held(interactable_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable held state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_interactable_released(JSContext *ctx, JSValueConst this_val) {
  WebSGInteractableData *interactable_data = JS_GetOpaque(this_val, js_websg_interactable_class_id);

  int32_t result = websg_node_get_interactable_released(interactable_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable released state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static const JSCFunctionListEntry js_websg_interactable_proto_funcs[] = {
  JS_CGETSET_DEF("pressed", js_websg_interactable_pressed, NULL),
  JS_CGETSET_DEF("held", js_websg_interactable_held, NULL),
  JS_CGETSET_DEF("released", js_websg_interactable_released, NULL),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Interactable", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_interactable_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_interactable(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_interactable_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_interactable_class_id, &js_websg_interactable_class);
  JSValue interactable_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    interactable_proto,
    js_websg_interactable_proto_funcs,
    countof(js_websg_interactable_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_interactable_class_id, interactable_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_interactable_constructor,
    "Interactable",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, interactable_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Interactable",
    constructor
  );

  interactable_type_interactable = JS_NewAtomUInt32(ctx, InteractableType_Interactable);
  interactable_type_grabbable = JS_NewAtomUInt32(ctx, InteractableType_Grabbable);

  JSValue interactable_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, interactable_type, "Interactable", JS_AtomToValue(ctx, interactable_type_interactable));
  JS_SetPropertyStr(ctx, interactable_type, "Grabbable", JS_AtomToValue(ctx, interactable_type_grabbable));
  JS_SetPropertyStr(ctx, websg, "InteractableType", interactable_type);
}

/**
 * Node Methods
 **/

JSValue js_websg_init_node_interactable(JSContext *ctx, node_id_t node_id) {
  if (websg_node_has_interactable(node_id) == 0) {
    return JS_UNDEFINED;
  }

  JSValue interactable = JS_NewObjectClass(ctx, js_websg_interactable_class_id);

  if (JS_IsException(interactable)) {
    return interactable;
  }

  WebSGInteractableData *interactable_data = js_mallocz(ctx, sizeof(WebSGInteractableData));
  interactable_data->node_id = node_id;
  JS_SetOpaque(interactable, interactable_data);
  
  return interactable;
}

JSValue js_websg_node_add_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, js_websg_node_class_id);

  InteractableProps *props = js_mallocz(ctx, sizeof(InteractableProps));
  props->type = InteractableType_Interactable;

  if (!JS_IsUndefined(argv[0])) {
    JSValue type_val = JS_GetPropertyStr(ctx, argv[0], "type");
    if (!JS_IsUndefined(type_val)) { 
      uint32_t type;

      if (JS_ToUint32(ctx, &type, type_val) == -1) {
        return JS_EXCEPTION;
      }

      props->type = type;
    }
  }

  int32_t result = websg_node_add_interactable(node_data->node_id, props);

  js_free(ctx, props);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error adding interactable.");
    return JS_EXCEPTION;
  }

  JSValue interactable = JS_NewObjectClass(ctx, js_websg_interactable_class_id);

  if (JS_IsException(interactable)) {
    return interactable;
  }

  WebSGInteractableData *interactable_data = js_mallocz(ctx, sizeof(WebSGInteractableData));
  interactable_data->node_id = node_data->node_id;
  JS_SetOpaque(interactable, interactable_data);

  node_data->interactable = JS_DupValue(ctx, interactable);

  return interactable;
}

JSValue js_websg_node_remove_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, js_websg_node_class_id);

  int32_t result = websg_node_remove_interactable(node_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error removing interactable.");
    return JS_EXCEPTION;
  }

  JS_FreeValue(ctx, node_data->interactable);

  node_data->interactable = JS_UNDEFINED;

  return JS_UNDEFINED;
}

JSValue js_websg_node_get_interactable(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, js_websg_node_class_id);

  if (websg_node_has_interactable(node_data->node_id) && JS_IsUndefined(node_data->interactable)) {
    JSValue interactable = JS_NewObjectClass(ctx, js_websg_interactable_class_id);

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
