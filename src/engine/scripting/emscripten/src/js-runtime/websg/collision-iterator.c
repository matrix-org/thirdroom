#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./collision.h"
#include "./collision-iterator.h"

JSClassID js_websg_collision_iterator_class_id;

static void js_websg_collision_iterator_finalizer(JSRuntime *rt, JSValue val) {
  WebSGCollisionIteratorData *it = JS_GetOpaque(val, js_websg_collision_iterator_class_id);

  if (it) {
    js_free_rt(rt, it->collisions);
    js_free_rt(rt, it);
  }
}

static JSClassDef js_collision_iterator_class = {
  "CollisionIterator",
  .finalizer = js_websg_collision_iterator_finalizer
};

static JSValue js_websg_collision_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  WebSGCollisionIteratorData *it = JS_GetOpaque2(ctx, this_val, js_websg_collision_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  if (it->idx >= it->count) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;

  CollisionItem collision = it->collisions[it->idx];

  JSValue val = js_websg_new_collision(ctx, it->world_data, &collision);

  it->idx = it->idx + 1;

  return val;
}

static JSValue js_websg_collision_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}

static const JSCFunctionListEntry js_children_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_websg_collision_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "CollisionIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_websg_collision_iterator),
};

void js_websg_define_collision_iterator(JSContext *ctx) {
  JS_NewClassID(&js_websg_collision_iterator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_collision_iterator_class_id, &js_collision_iterator_class);
  JSValue proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, proto, js_children_iterator_proto_funcs, countof(js_children_iterator_proto_funcs));
  JS_SetClassProto(ctx, js_websg_collision_iterator_class_id, proto);
}

JSValue js_websg_create_collision_iterator(JSContext *ctx, WebSGCollisionListenerData *listener_data) {
  WebSGCollisionIteratorData *it = js_mallocz(ctx, sizeof(WebSGCollisionIteratorData));
  it->world_data = listener_data->world_data;
  it->count = websg_collisions_listener_get_collision_count(listener_data->listener_id);

  if (it->count == -1) {
    js_free(ctx, it);
    JS_ThrowInternalError(ctx, "WebSGNetworking: error getting collision count.");
    return JS_EXCEPTION;
  }

  CollisionItem *collisions = it->count == 0 ? NULL : js_mallocz(ctx, it->count * sizeof(CollisionItem));

  if (websg_collisions_listener_get_collisions(listener_data->listener_id, collisions, it->count) == -1) {
    js_free(ctx, it);
    js_free(ctx, collisions);
    JS_ThrowInternalError(ctx, "WebSGNetworking: error getting collisions.");
    return JS_EXCEPTION;
  }

  it->collisions = collisions;

  JSValue iter_obj = JS_NewObjectClass(ctx, js_websg_collision_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}