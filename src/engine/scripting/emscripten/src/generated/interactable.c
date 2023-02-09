#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../../include/quickjs/cutils.h"
#include "../../include/quickjs/quickjs.h"

#include "../jsutils.h"
#include "../websg-utils.h"
#include "../script-context.h"
#include "websg.h"
#include "interactable.h"

/**
 * WebSG.Interactable
 */

JSClassID js_interactable_class_id;

static JSValue js_interactable_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Interactable *interactable = js_mallocz(ctx, sizeof(Interactable));

  

  if (websg_create_resource(ResourceType_Interactable, interactable)) {
    return JS_EXCEPTION;
  }

  return create_interactable_from_ptr(ctx, interactable);
}


static JSValue js_interactable_get_name(JSContext *ctx, JSValueConst this_val) {
  Interactable *interactable = JS_GetOpaque2(ctx, this_val, js_interactable_class_id);

  if (!interactable) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, interactable->name);
    return val;
  }
}


static JSValue js_interactable_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Interactable *interactable = JS_GetOpaque2(ctx, this_val, js_interactable_class_id);

  if (!interactable) {
    return JS_EXCEPTION;
  } else {
    interactable->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_interactable_get_type(JSContext *ctx, JSValueConst this_val) {
  Interactable *interactable = JS_GetOpaque2(ctx, this_val, js_interactable_class_id);

  if (!interactable) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, interactable->type);
    return val;
  }
}


static JSValue js_interactable_get_pressed(JSContext *ctx, JSValueConst this_val) {
  Interactable *interactable = JS_GetOpaque2(ctx, this_val, js_interactable_class_id);

  if (!interactable) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, interactable->pressed);
    return val;
  }
}


static JSValue js_interactable_get_held(JSContext *ctx, JSValueConst this_val) {
  Interactable *interactable = JS_GetOpaque2(ctx, this_val, js_interactable_class_id);

  if (!interactable) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, interactable->held);
    return val;
  }
}


static JSValue js_interactable_get_released(JSContext *ctx, JSValueConst this_val) {
  Interactable *interactable = JS_GetOpaque2(ctx, this_val, js_interactable_class_id);

  if (!interactable) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, interactable->released);
    return val;
  }
}




static JSValue js_interactable_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Interactable *interactable = JS_GetOpaque(this_val, js_interactable_class_id);
  websg_dispose_resource(interactable);
  js_free(ctx, interactable);
  return JS_UNDEFINED;
}

static JSClassDef js_interactable_class = {
  "Interactable"
};

static const JSCFunctionListEntry js_interactable_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_interactable_get_name, js_interactable_set_name),
  JS_CGETSET_DEF("type", js_interactable_get_type, NULL),
  JS_CGETSET_DEF("pressed", js_interactable_get_pressed, NULL),
  JS_CGETSET_DEF("held", js_interactable_get_held, NULL),
  JS_CGETSET_DEF("released", js_interactable_get_released, NULL),
  JS_CFUNC_DEF("dispose", 0, js_interactable_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Interactable", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_interactable_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_interactable_class_id);
  JS_NewClass(rt, js_interactable_class_id, &js_interactable_class);

  JSValue interactable_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, interactable_proto, js_interactable_proto_funcs, countof(js_interactable_proto_funcs));
  
  JSValue interactable_class = JS_NewCFunction2(ctx, js_interactable_constructor, "Interactable", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, interactable_class, interactable_proto);
  JS_SetClassProto(ctx, js_interactable_class_id, interactable_proto);

  return interactable_class;
}

/**
 * WebSG.Interactable related functions
*/

static JSValue js_get_interactable_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Interactable *interactable = websg_get_resource_by_name(ResourceType_Interactable, name);
  JS_FreeCString(ctx, name);
  return create_interactable_from_ptr(ctx, interactable);
}

JSValue create_interactable_from_ptr(JSContext *ctx, Interactable *interactable) {
  if (!interactable) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, interactable);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_interactable_class_id);
    
    JS_SetOpaque(val, interactable);
    set_js_val_from_ptr(ctx, interactable, val);
  }

  return val;
}

void js_define_interactable_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Interactable", js_define_interactable_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getInteractableByName",
    JS_NewCFunction(ctx, js_get_interactable_by_name, "getInteractableByName", 1)
  );
}