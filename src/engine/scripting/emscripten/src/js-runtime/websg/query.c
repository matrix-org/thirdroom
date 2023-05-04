#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./query.h"
#include "./component-store.h"
#include "./node-iterator.h"

JSClassID js_websg_query_class_id;

/**
 * Class Definition
 **/

static void js_websg_query_finalizer(JSRuntime *rt, JSValue val) {
  WebSGQueryData *query_data = JS_GetOpaque(val, js_websg_query_class_id);

  if (query_data) {
    js_free_rt(rt, query_data);
  }
}

static JSClassDef js_websg_query_class = {
  "Query",
  .finalizer = js_websg_query_finalizer
};

static JSValue js_websg_query_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGQueryData *query_data = JS_GetOpaque(this_val, js_websg_query_class_id);

  int32_t count = websg_query_get_results_count(query_data->query_id);

  if (count == -1) {
    return JS_ThrowInternalError(ctx, "Failed to get query results count.");
  }

  node_id_t *nodes = js_malloc(ctx, sizeof(node_id_t) * count);

  if (websg_query_get_results(query_data->query_id, nodes, count) == -1) {
    js_free(ctx, nodes);
    return JS_ThrowInternalError(ctx, "Failed to get query results.");
  }

  return js_websg_create_node_iterator(ctx, query_data->world_data, nodes, count);
}

static const JSCFunctionListEntry js_websg_query_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Query", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_websg_query_iterator),
};

static JSValue js_websg_query_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_query(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_query_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_query_class_id, &js_websg_query_class);
  JSValue query_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    query_proto,
    js_websg_query_proto_funcs,
    countof(js_websg_query_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_query_class_id, query_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_query_constructor,
    "Query",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, query_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Query",
    constructor
  );
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_query(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  JSValue query_list_length_val = JS_GetPropertyStr(ctx, argv[0], "length");

  if (JS_IsException(query_list_length_val)) {
    return JS_EXCEPTION;
  }

  uint32_t query_list_length = 0;

  if (JS_ToUint32(ctx, &query_list_length, query_list_length_val) == -1) {
    return JS_EXCEPTION;
  }

  if (query_list_length == 0) {
    return JS_ThrowTypeError(ctx, "WebSG: Query must have at least one item.");
  }

  // TODO: Support query modifiers and multiple query list items
  // For now we just support a single array of component stores

  component_id_t *component_ids = js_mallocz(ctx, sizeof(component_id_t) * query_list_length);

  int error = 0;

  for (int i = 0; i < query_list_length; i++) {
    JSValue component_definition_val = JS_GetPropertyUint32(ctx, argv[0], i);

    WebSGComponentStoreData *component_store_data = JS_GetOpaque2(
      ctx,
      component_definition_val,
      js_websg_component_store_class_id
    );

    if (component_store_data == NULL) {
      error = 1;
      break;
    }

    component_ids[i] = component_store_data->component_id;
  }

  if (error) {
    js_free(ctx, component_ids);
    return JS_EXCEPTION;
  }

  QueryItem *query_list_item = js_mallocz(ctx, sizeof(QueryItem));
  query_list_item->component_ids = component_ids;
  query_list_item->component_count = query_list_length;
  query_list_item->modifier = QueryModifier_All;

  QueryList *query_list = js_mallocz(ctx, sizeof(QueryList));
  query_list->items = query_list_item;
  query_list->count = 1;

  query_id_t query_id = websg_world_create_query(query_list);

  js_free(ctx, component_ids);
  js_free(ctx, query_list_item);
  js_free(ctx, query_list);

  if (query_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create query.");
    return JS_EXCEPTION;
  }

  JSValue query = JS_NewObjectClass(ctx, js_websg_query_class_id);

  if (JS_IsException(query)) {
    return query;
  }

  WebSGQueryData *query_data = js_mallocz(ctx, sizeof(WebSGQueryData));
  query_data->world_data = world_data;
  query_data->query_id = query_id;
  JS_SetOpaque(query, query_data);

  return query;
}
