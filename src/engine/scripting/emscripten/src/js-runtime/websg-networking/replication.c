#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./peer.h"
#include "./replication.h"
#include "../utils/array.h"
#include "../websg/node.h"

JSClassID js_websg_replication_class_id;

static JSClassDef js_websg_replication_class = {
  "Replication",
};

static const JSCFunctionListEntry js_websg_replication_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Replication", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_replication_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_replication(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_replication_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_replication_class_id, &js_websg_replication_class);
  JSValue replication_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, replication_proto, js_websg_replication_proto_funcs, countof(js_websg_replication_proto_funcs));
  JS_SetClassProto(ctx, js_websg_replication_class_id, replication_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_replication_constructor,
    "Replication",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, replication_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Replication",
    constructor
  );
}

JSValue js_websg_new_replication_instance(
  JSContext *ctx,
  JSValue node,
  JSValue peer,
  JSValue data
) {
  JSValue replication = JS_NewObjectClass(ctx, js_websg_replication_class_id);

  if (JS_IsException(replication)) {
    return replication;
  }

  JS_SetPropertyStr(ctx, replication, "node", node);
  JS_SetPropertyStr(ctx, replication, "peer", peer);

  if (JS_IsUndefined(data)) {
    JS_SetPropertyStr(ctx, replication, "data", JS_UNDEFINED);
  } else {
    JS_SetPropertyStr(ctx, replication, "data", data);
  }

  return replication;
}
