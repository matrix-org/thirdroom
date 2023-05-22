#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./world.h"
#include "./collision-listener.h"
#include "./collision-iterator.h"

JSClassID js_websg_collision_listener_class_id;

/**
 * Class Definition
 **/

static void js_websg_collision_listener_finalizer(JSRuntime *rt, JSValue val) {
  WebSGCollisionListenerData *collision_listener_data = JS_GetOpaque(val, js_websg_collision_listener_class_id);

  if (collision_listener_data) {
    js_free_rt(rt, collision_listener_data);
  }
}

static JSClassDef js_websg_collision_listener_class = {
  "CollisionListener",
  .finalizer = js_websg_collision_listener_finalizer
};

static JSValue js_websg_collision_listener_collisions(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGCollisionListenerData *collision_listener_data = JS_GetOpaque(this_val, js_websg_collision_listener_class_id);
  return js_websg_create_collision_iterator(ctx, collision_listener_data);
}

static JSValue js_websg_collision_listener_dispose(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGCollisionListenerData *collision_listener_data = JS_GetOpaque(this_val, js_websg_collision_listener_class_id);

  if (websg_collision_listener_dispose(collision_listener_data->listener_id) == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error closing listener.");

  return JS_EXCEPTION;
}

static const JSCFunctionListEntry js_websg_collision_listener_proto_funcs[] = {
  JS_CFUNC_DEF("collisions", 1, js_websg_collision_listener_collisions),
  JS_CFUNC_DEF("dispose", 0, js_websg_collision_listener_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "CollisionListener", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_collision_listener_constructor(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_collision_listener(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_collision_listener_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_collision_listener_class_id, &js_websg_collision_listener_class);
  JSValue collision_listener_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    collision_listener_proto,
    js_websg_collision_listener_proto_funcs,
    countof(js_websg_collision_listener_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_collision_listener_class_id, collision_listener_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_collision_listener_constructor,
    "CollisionListener",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, collision_listener_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "CollisionListener",
    constructor
  );
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_collision_listener(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  JSValue collision_listener = JS_NewObjectClass(ctx, js_websg_collision_listener_class_id);

  if (JS_IsException(collision_listener)) {
    return collision_listener;
  }

  collision_listener_id_t listener_id = websg_world_create_collision_listener();

  if (listener_id == 0) {
    JS_ThrowInternalError(ctx, "WebSGNetworking: error creating listener.");
    return JS_EXCEPTION;
  }

  WebSGCollisionListenerData *listener_data = js_mallocz(ctx, sizeof(WebSGCollisionListenerData));
  listener_data->world_data = world_data;
  listener_data->listener_id = listener_id;
  JS_SetOpaque(collision_listener, listener_data);
  
  return collision_listener;
}
