#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./node.h"
#include "./node-iterator.h"

JSClassID js_websg_node_iterator_class_id;

static void js_websg_node_iterator_finalizer(JSRuntime *rt, JSValue val) {
  JSWebSGNodeIteratorData *it = JS_GetOpaque(val, js_websg_node_iterator_class_id);

  if (it) {
    js_free_rt(rt, it->nodes);
    js_free_rt(rt, it);
  }
}

static JSClassDef js_ref_children_iterator_class = {
  "NodeIterator",
  .finalizer = js_websg_node_iterator_finalizer
};

static JSValue js_websg_node_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  JSWebSGNodeIteratorData *it = JS_GetOpaque2(ctx, this_val, js_websg_node_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  if (it->idx >= it->count) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;

  node_id_t node_id = it->nodes[it->idx];

  JSValue val = js_websg_get_node_by_id(ctx, it->world_data, node_id);

  it->idx = it->idx + 1;

  return val;
}

static JSValue js_websg_node_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}


static const JSCFunctionListEntry js_children_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_websg_node_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGNodeIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_websg_node_iterator),
};

void js_websg_define_node_iterator(JSContext *ctx) {
  JS_NewClassID(&js_websg_node_iterator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_node_iterator_class_id, &js_ref_children_iterator_class);
  JSValue proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, proto, js_children_iterator_proto_funcs, countof(js_children_iterator_proto_funcs));
  JS_SetClassProto(ctx, js_websg_node_iterator_class_id, proto);
}

JSValue js_websg_create_node_iterator(JSContext *ctx, WebSGWorldData *world_data, node_id_t *nodes, uint32_t count) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_websg_node_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  JSWebSGNodeIteratorData *it = js_mallocz(ctx, sizeof(JSWebSGNodeIteratorData));

  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  it->world_data = world_data;
  it->nodes = nodes;
  it->idx = 0;
  it->count = count;

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}