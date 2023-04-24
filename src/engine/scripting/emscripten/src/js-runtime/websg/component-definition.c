#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./component-definition.h"

JSClassID js_websg_component_definition_class_id;

/**
 * Class Definition
 **/

static void js_websg_component_definition_finalizer(JSRuntime *rt, JSValue val) {
  WebSGComponentDefinitionData *component_definition_data = JS_GetOpaque(val, js_websg_component_definition_class_id);

  if (component_definition_data) {
    js_free_rt(rt, component_definition_data);
  }
}

static JSClassDef js_websg_component_definition_class = {
  "ComponentDefinition",
  .finalizer = js_websg_component_definition_finalizer
};

static const JSCFunctionListEntry js_websg_component_definition_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ComponentDefinition", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_component_definition_constructor(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_component_definition(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_component_definition_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_component_definition_class_id, &js_websg_component_definition_class);
  JSValue component_definition_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    component_definition_proto,
    js_websg_component_definition_proto_funcs,
    countof(js_websg_component_definition_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_component_definition_class_id, component_definition_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_component_definition_constructor,
    "ComponentDefinition",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, component_definition_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "ComponentDefinition",
    constructor
  );
}

/**
 * Public Methods
 **/

JSValue js_websg_new_component_definition_instance(
  JSContext *ctx,
  WebSGWorldData *world_data,
  component_id_t component_id
) {
  JSValue component_definition = JS_NewObjectClass(ctx, js_websg_component_definition_class_id);

  if (JS_IsException(component_definition)) {
    return component_definition;
  }

  int32_t prop_count = websg_component_definition_get_prop_count(component_id);

  if (prop_count == -1) {
    return JS_ThrowInternalError(ctx, "Failed to get prop count");
  }

  WebSGComponentPropDefinition *prop_definitions = js_mallocz(ctx, sizeof(WebSGComponentPropDefinition) * prop_count);

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

    prop_definitions[i].name = prop_name;
    prop_definitions[i].type = prop_type;
  }

  WebSGComponentDefinitionData *component_definition_data = js_mallocz(ctx, sizeof(WebSGComponentDefinitionData));
  component_definition_data->world_data = world_data;
  component_definition_data->component_id = component_id;
  component_definition_data->prop_definitions = prop_definitions;
  component_definition_data->prop_count = prop_count;
  JS_SetOpaque(component_definition, component_definition_data);

  JS_SetPropertyUint32(ctx, world_data->component_definitions, component_id, JS_DupValue(ctx, component_definition));
  
  return component_definition;
}

JSValue js_websg_get_component_definition_by_id(
  JSContext *ctx,
  WebSGWorldData *world_data,
  component_id_t component_id
) {
  JSValue component_definition = JS_GetPropertyUint32(ctx, world_data->component_definitions, component_id);

  if (!JS_IsUndefined(component_definition)) {
    return JS_DupValue(ctx, component_definition);
  }

  return js_websg_new_component_definition_instance(ctx, world_data, component_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_find_component_definition_by_name(
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

  return js_websg_get_component_definition_by_id(ctx, world_data, component_id);
}
