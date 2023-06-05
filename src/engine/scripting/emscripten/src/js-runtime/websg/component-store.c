#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./component-store.h"
#include "./component.h"

JSClassID js_websg_component_store_class_id;

/**
 * Class Definition
 **/

static void js_websg_component_store_finalizer(JSRuntime *rt, JSValue val) {
  WebSGComponentStoreData *component_store_data = JS_GetOpaque(val, js_websg_component_store_class_id);

  if (component_store_data) {
    js_free_rt(rt, component_store_data->store);
    js_free_rt(rt, component_store_data);
  }
}

static JSClassDef js_websg_component_store_class = {
  "ComponentStore",
  .finalizer = js_websg_component_store_finalizer
};

static const JSCFunctionListEntry js_websg_component_store_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ComponentStore", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_component_store_constructor(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_component_store(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_component_store_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_component_store_class_id, &js_websg_component_store_class);
  JSValue component_store_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    component_store_proto,
    js_websg_component_store_proto_funcs,
    countof(js_websg_component_store_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_component_store_class_id, component_store_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_component_store_constructor,
    "ComponentStore",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, component_store_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "ComponentStore",
    constructor
  );
}

/**
 * Public Methods
 **/

JSValue js_websg_new_component_store_instance(
  JSContext *ctx,
  WebSGWorldData *world_data,
  component_id_t component_id
) {
  JSValue component_store = JS_NewObjectClass(ctx, js_websg_component_store_class_id);

  if (JS_IsException(component_store)) {
    return component_store;
  }

  uint32_t component_store_size = websg_world_get_component_store_size();

  size_t store_byte_length;
  uint32_t *prop_byte_offsets;

  JSClassID component_instance_class_id = js_websg_define_component_instance(
    ctx,
    component_id,
    component_store_size,
    &store_byte_length,
    &prop_byte_offsets
  );

  if (component_instance_class_id == 0) {
    return JS_EXCEPTION;
  }

  // This is the backing store for component data
  void *store = store_byte_length == 0 ? NULL : js_mallocz(ctx, store_byte_length);

  websg_world_set_component_store(component_id, store);

  WebSGComponentStoreData *component_store_data = js_mallocz(ctx, sizeof(WebSGComponentStoreData));
  component_store_data->world_data = world_data;
  component_store_data->component_id = component_id;
  component_store_data->component_instance_class_id = component_instance_class_id;
  component_store_data->component_instances = JS_NewObject(ctx);
  component_store_data->prop_byte_offsets = prop_byte_offsets;
  component_store_data->store = store;
  JS_SetOpaque(component_store, component_store_data);

  JS_SetPropertyUint32(ctx, world_data->component_stores, component_id, JS_DupValue(ctx, component_store));
  
  return component_store;
}

JSValue js_websg_component_store_get_instance(
  JSContext *ctx,
  WebSGComponentStoreData *component_store_data,
  uint32_t component_store_index
) {
  JSValue component_instance = JS_GetPropertyUint32(
    ctx,
    component_store_data->component_instances,
    component_store_index
  );

  if (JS_IsUndefined(component_instance)) {
    component_instance = js_websg_create_component_instance(
      ctx,
      component_store_data,
      component_store_index
    );

    JS_SetPropertyUint32(
      ctx,
      component_store_data->component_instances,
      component_store_index,
      component_instance
    );
  }

  return JS_DupValue(ctx, component_instance);
}

JSValue js_websg_get_component_store_by_id(
  JSContext *ctx,
  WebSGWorldData *world_data,
  component_id_t component_id
) {
  JSValue component_store = JS_GetPropertyUint32(ctx, world_data->component_stores, component_id);

  if (!JS_IsUndefined(component_store)) {
    return JS_DupValue(ctx, component_store);
  }

  return js_websg_new_component_store_instance(ctx, world_data, component_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_find_component_store_by_name(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  component_id_t component_id = websg_world_find_component_definition_by_name(name, length);

  if (component_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_component_store_by_id(ctx, world_data, component_id);
}
