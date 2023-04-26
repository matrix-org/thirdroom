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

  uint32_t component_name_length = websg_component_definition_get_name_length(component_id);

  if (component_name_length == 0) {
    return JS_ThrowInternalError(ctx, "Failed to get component name length");
  }

  const char *component_name = js_mallocz(ctx, sizeof(char) * component_name_length);

  if (websg_component_definition_get_component_name(component_id, component_name, component_name_length) == -1) {
    return JS_ThrowInternalError(ctx, "Failed to get component name");
  }

  int32_t prop_count = websg_component_definition_get_prop_count(component_id);

  if (prop_count == -1) {
    return JS_ThrowInternalError(ctx, "Failed to get component prop count");
  }

  uint32_t component_store_size = websg_world_get_component_store_size();

  JSClassDef *class_def = js_mallocz(ctx, sizeof(JSClassDef));
  class_def->class_name = component_name;

  JSClassID component_instance_class_id;
  JS_NewClassID(&component_instance_class_id);
  JS_NewClass(JS_GetRuntime(ctx), component_instance_class_id, class_def);
  JSValue component_instance_proto = JS_NewObject(ctx);

  int32_t byte_offset = 0;

  for (int32_t i = 0; i < prop_count; i++) {
    uint32_t prop_name_length = websg_component_definition_get_prop_name_length(component_id, i);

    if (prop_name_length == 0) {
      return JS_ThrowInternalError(ctx, "Failed to get prop name length");
    }

    const char *prop_name = js_mallocz(ctx, sizeof(char) * prop_name_length);

    if (websg_component_definition_get_prop_name(component_id, i, prop_name, prop_name_length) == -1) {
      return JS_ThrowInternalError(ctx, "Failed to get prop name");
    }

    uint32_t prop_type_length = websg_component_definition_get_prop_type_length(component_id, i);

    if (prop_type_length == 0) {
      return JS_ThrowInternalError(ctx, "Failed to get prop type length");
    }

    const char *prop_type = js_mallocz(ctx, sizeof(char) * prop_type_length);

    if (websg_component_definition_get_prop_type(component_id, i, prop_type, prop_type_length) == -1) {
      return JS_ThrowInternalError(ctx, "Failed to get prop type");
    }

    ComponentPropStorageType storage_type = websg_component_definition_get_prop_storage_type(component_id, i);

    if (storage_type == -1) {
      return JS_ThrowInternalError(ctx, "Failed to get prop storage type");
    }

    int32_t prop_size = websg_component_definition_get_prop_size(component_id, i);

    if (prop_size < 1) {
      return JS_ThrowInternalError(ctx, "Failed to get prop size");
    }

    // All props are 4 byte aligned
    int32_t prop_byte_length = 4 * prop_size;
    int32_t store_byte_length = prop_byte_length * component_store_size;

    JSCFunctionMagic *getter_fn;
    JSCFunctionMagic *setter_fn;

    char buf[64];

    snprintf(buf, sizeof(buf), "get %s", prop_name);

    JSValue getter = JS_NewCFunctionMagic(
      ctx,
      getter_fn,
      buf,
      0,
      JS_CFUNC_getter_magic,
      byte_offset
    );

    snprintf(buf, sizeof(buf), "set %s", prop_name);

    JSValue setter = JS_NewCFunctionMagic(
      ctx,
      setter_fn,
      buf,
      1,
      JS_CFUNC_setter_magic,
      byte_offset
    );

    JS_DefinePropertyGetSet(
      ctx,
      component_instance_proto,
      JS_NewAtom(ctx, prop_name),
      getter,
      setter,
      JS_PROP_CONFIGURABLE
    );

    byte_offset += store_byte_length;
  }

  // This is the backing store for component data
  void *store = js_mallocz(ctx, byte_offset);

  WebSGComponentStoreData *component_store_data = js_mallocz(ctx, sizeof(WebSGComponentStoreData));
  component_store_data->world_data = world_data;
  component_store_data->component_id = component_id;
  component_store_data->component_instances = JS_NewObject(ctx);
  component_store_data->store = store;
  JS_SetOpaque(component_store, component_store_data);

  JS_SetPropertyUint32(ctx, world_data->component_stores, component_id, JS_DupValue(ctx, component_store));
  
  return component_store;
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

  component_id_t component_id = websg_world_find_component_store_by_name(name, length);

  if (component_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_component_store_by_id(ctx, world_data, component_id);
}
