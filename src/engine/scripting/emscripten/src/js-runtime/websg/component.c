#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./component.h"

JSClassID js_websg_component_class_id;

/**
 * Class Definition
 **/

static void js_websg_component_finalizer(JSRuntime *rt, JSValue val) {
  WebSGComponentData *component_data = JS_GetOpaque(val, js_websg_component_class_id);

  if (component_data) {
    js_free_rt(rt, component_data);
  }
}

static JSClassDef js_websg_component_class = {
  "Component",
  .finalizer = js_websg_component_finalizer
};

static const JSCFunctionListEntry js_websg_component_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Component", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_component_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_component(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_component_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_component_class_id, &js_websg_component_class);
  JSValue component_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    component_proto,
    js_websg_component_proto_funcs,
    countof(js_websg_component_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_component_class_id, component_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_component_constructor,
    "Component",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, component_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Component",
    constructor
  );
}
