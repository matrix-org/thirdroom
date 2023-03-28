#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-js.h"
#include "./websg-accessor-js.h"

static void js_websg_accessor_finalizer(JSRuntime *rt, JSValue val) {
  WebSGAccessorData *accessor_data = JS_GetOpaque(val, websg_accessor_class_id);

  if (accessor_data) {
    js_free_rt(rt, accessor_data);
  }
}

static JSClassDef websg_accessor_class = {
  "WebSGAccessor",
  .finalizer = js_websg_accessor_finalizer
};

static const JSCFunctionListEntry websg_accessor_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGAccessor", JS_PROP_CONFIGURABLE),
};

void js_define_websg_accessor(JSContext *ctx) {
  JS_NewClassID(&websg_accessor_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_accessor_class_id, &websg_accessor_class);
  JSValue accessor_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    accessor_proto,
    websg_accessor_proto_funcs,
    countof(websg_accessor_proto_funcs)
  );
  JS_SetClassProto(ctx, websg_accessor_class_id, accessor_proto);
}

JSValue js_websg_new_accessor_instance(JSContext *ctx, WebSGContext *websg, accessor_id_t accessor_id) {
  JSValue accessor = JS_NewObjectClass(ctx, websg_accessor_class_id);

  if (JS_IsException(accessor)) {
    return accessor;
  }

  WebSGAccessorData *accessor_data = js_mallocz(ctx, sizeof(WebSGAccessorData));
  accessor_data->accessor_id = accessor_id;
  JS_SetOpaque(accessor, accessor_data);
  
  return accessor;
}