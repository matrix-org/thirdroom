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
#include "nametag.h"

/**
 * WebSG.Nametag
 */

JSClassID js_nametag_class_id;

static JSValue js_nametag_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Nametag *nametag = js_mallocz(ctx, sizeof(Nametag));

  

  if (websg_create_resource(ResourceType_Nametag, nametag)) {
    return JS_EXCEPTION;
  }

  return create_nametag_from_ptr(ctx, nametag);
}





static JSValue js_nametag_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Nametag *nametag = JS_GetOpaque(this_val, js_nametag_class_id);
  websg_dispose_resource(nametag);
  js_free(ctx, nametag);
  return JS_UNDEFINED;
}

static JSClassDef js_nametag_class = {
  "Nametag"
};

static const JSCFunctionListEntry js_nametag_proto_funcs[] = {

  JS_CFUNC_DEF("dispose", 0, js_nametag_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Nametag", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_nametag_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_nametag_class_id);
  JS_NewClass(rt, js_nametag_class_id, &js_nametag_class);

  JSValue nametag_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, nametag_proto, js_nametag_proto_funcs, countof(js_nametag_proto_funcs));
  
  JSValue nametag_class = JS_NewCFunction2(ctx, js_nametag_constructor, "Nametag", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, nametag_class, nametag_proto);
  JS_SetClassProto(ctx, js_nametag_class_id, nametag_proto);

  return nametag_class;
}

/**
 * WebSG.Nametag related functions
*/

static JSValue js_get_nametag_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Nametag *nametag = websg_get_resource_by_name(ResourceType_Nametag, name);
  JS_FreeCString(ctx, name);
  return create_nametag_from_ptr(ctx, nametag);
}

JSValue create_nametag_from_ptr(JSContext *ctx, Nametag *nametag) {
  if (!nametag) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, nametag);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_nametag_class_id);
    
    JS_SetOpaque(val, nametag);
    set_js_val_from_ptr(ctx, nametag, val);
  }

  return val;
}

void js_define_nametag_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Nametag", js_define_nametag_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getNametagByName",
    JS_NewCFunction(ctx, js_get_nametag_by_name, "getNametagByName", 1)
  );
}