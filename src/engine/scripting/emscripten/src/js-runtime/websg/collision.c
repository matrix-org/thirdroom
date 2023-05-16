#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./collision.h"
#include "./node.h"
#include "./world.h"

JSClassID js_websg_collision_class_id;

/**
 * Class Definition
 **/

static JSClassDef js_websg_collision_class = {
  "Collision",
};

static const JSCFunctionListEntry js_websg_collision_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Collision", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_collision_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_collision(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_collision_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_collision_class_id, &js_websg_collision_class);
  JSValue collision_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    collision_proto,
    js_websg_collision_proto_funcs,
    countof(js_websg_collision_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_collision_class_id, collision_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_collision_constructor,
    "Collision",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, collision_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Collision",
    constructor
  );
}

/**
 * Public Methods
 **/

JSValue js_websg_new_collision(JSContext *ctx, WebSGWorldData *world_data, CollisionItem *collision_item) {
  JSValue collision = JS_NewObjectClass(ctx, js_websg_collision_class_id);

  if (JS_IsException(collision)) {
    return collision;
  }

  JSValue node_a = js_websg_get_node_by_id(ctx, world_data, collision_item->node_a);

  JS_DefinePropertyValueStr(
    ctx,
    collision,
    "nodeA",
    node_a,
    JS_PROP_ENUMERABLE | JS_PROP_CONFIGURABLE
  );

  JSValue node_b = js_websg_get_node_by_id(ctx, world_data, collision_item->node_b);

  JS_DefinePropertyValueStr(
    ctx,
    collision,
    "nodeB",
    node_b,
    JS_PROP_ENUMERABLE | JS_PROP_CONFIGURABLE
  );

  JSValue started = JS_NewBool(ctx, collision_item->started);

  JS_DefinePropertyValueStr(
    ctx,
    collision,
    "started",
    started,
    JS_PROP_ENUMERABLE | JS_PROP_CONFIGURABLE
  );
  
  return collision;
}
