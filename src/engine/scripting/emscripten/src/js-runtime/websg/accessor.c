#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./world.h"
#include "./accessor.h"

JSClassID js_websg_accessor_class_id;

/**
 * Private Methods and Variables
 **/

JSAtom SCALAR;
JSAtom VEC2;
JSAtom VEC3;
JSAtom VEC4;
JSAtom MAT2;
JSAtom MAT3;
JSAtom MAT4;

AccessorType get_accessor_type_from_atom(JSAtom atom) {
  if (atom == SCALAR) {
    return AccessorType_SCALAR;
  } else if (atom == VEC2) {
    return AccessorType_VEC2;
  } else if (atom == VEC3) {
    return AccessorType_VEC3;
  } else if (atom == VEC4) {
    return AccessorType_VEC4;
  } else if (atom == MAT2) {
    return AccessorType_MAT2;
  } else if (atom == MAT3) {
    return AccessorType_MAT3;
  } else if (atom == MAT4) {
    return AccessorType_MAT4;
  } else {
    return -1;
  }
}

/**
 * Class Definition
 **/

static void js_websg_accessor_finalizer(JSRuntime *rt, JSValue val) {
  WebSGAccessorData *accessor_data = JS_GetOpaque(val, js_websg_accessor_class_id);

  if (accessor_data) {
    js_free_rt(rt, accessor_data);
  }
}

JSValue js_websg_accessor_update_with(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGAccessorData *accessor_data = JS_GetOpaque(this_val, js_websg_accessor_class_id);

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, argv[0]);

  if (data == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_accessor_update_with(accessor_data->accessor_id, data, buffer_byte_length);

  if (result < 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't update accessor.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static const JSCFunctionListEntry js_websg_accessor_proto_funcs[] = {
  JS_CFUNC_DEF("updateWith", 1, js_websg_accessor_update_with),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Accessor", JS_PROP_CONFIGURABLE),
};

static JSClassDef js_websg_accessor_class = {
  "Accessor",
  .finalizer = js_websg_accessor_finalizer
};

static JSValue js_websg_accessor_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_accessor(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_accessor_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_accessor_class_id, &js_websg_accessor_class);
  JSValue accessor_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    accessor_proto,
    js_websg_accessor_proto_funcs,
    countof(js_websg_accessor_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_accessor_class_id, accessor_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_accessor_constructor,
    "Accessor",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, accessor_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Accessor",
    constructor
  );

  SCALAR = JS_NewAtom(ctx, "SCALAR");
  VEC2 = JS_NewAtom(ctx, "VEC2");
  VEC3 = JS_NewAtom(ctx, "VEC3");
  VEC4 = JS_NewAtom(ctx, "VEC4");
  MAT2 = JS_NewAtom(ctx, "MAT2");
  MAT3 = JS_NewAtom(ctx, "MAT3");
  MAT4 = JS_NewAtom(ctx, "MAT4");

  JSValue accessor_type = JS_NewObject(ctx);
  JS_SetProperty(ctx, accessor_type, SCALAR, JS_AtomToValue(ctx, SCALAR));
  JS_SetProperty(ctx, accessor_type, VEC2, JS_AtomToValue(ctx, VEC2));
  JS_SetProperty(ctx, accessor_type, VEC3, JS_AtomToValue(ctx, VEC3));
  JS_SetProperty(ctx, accessor_type, VEC4, JS_AtomToValue(ctx, VEC4));
  JS_SetProperty(ctx, accessor_type, MAT2, JS_AtomToValue(ctx, MAT2));
  JS_SetProperty(ctx, accessor_type, MAT3, JS_AtomToValue(ctx, MAT3));
  JS_SetProperty(ctx, accessor_type, MAT4, JS_AtomToValue(ctx, MAT4));
  JS_SetPropertyStr(ctx, websg, "AccessorType", accessor_type);

  JSValue accessor_component_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, accessor_component_type, "Int8", JS_NewUint32(ctx, 5120));
  JS_SetPropertyStr(ctx, accessor_component_type, "Uint8", JS_NewUint32(ctx, 5121));
  JS_SetPropertyStr(ctx, accessor_component_type, "Int16", JS_NewUint32(ctx, 5122));
  JS_SetPropertyStr(ctx, accessor_component_type, "Uint16", JS_NewUint32(ctx, 5123));
  JS_SetPropertyStr(ctx, accessor_component_type, "Uint32", JS_NewUint32(ctx, 5125));
  JS_SetPropertyStr(ctx, accessor_component_type, "Float32", JS_NewUint32(ctx, 5126));
  JS_SetPropertyStr(ctx, websg, "AccessorComponentType", accessor_component_type);
}

JSValue js_websg_new_accessor_instance(JSContext *ctx, WebSGWorldData *world_data, accessor_id_t accessor_id) {
  JSValue accessor = JS_NewObjectClass(ctx, js_websg_accessor_class_id);

  if (JS_IsException(accessor)) {
    return accessor;
  }

  WebSGAccessorData *accessor_data = js_mallocz(ctx, sizeof(WebSGAccessorData));
  accessor_data->world_data = world_data;
  accessor_data->accessor_id = accessor_id;
  JS_SetOpaque(accessor, accessor_data);

  JS_SetPropertyUint32(ctx, world_data->accessors, accessor_id, JS_DupValue(ctx, accessor));
  
  return accessor;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_accessor_by_id(JSContext *ctx, WebSGWorldData *world_data, accessor_id_t accessor_id) {
  JSValue accessor = JS_GetPropertyUint32(ctx, world_data->accessors, accessor_id);

  if (!JS_IsUndefined(accessor)) {
    return JS_DupValue(ctx, accessor);
  }

  return js_websg_new_accessor_instance(ctx, world_data, accessor_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_accessor_from(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, argv[0]);

  if (data == NULL) {
    return JS_EXCEPTION;
  }

  JSValue props_obj = argv[1];

  AccessorFromProps *props = js_mallocz(ctx, sizeof(AccessorFromProps));

  JSValue type_val = JS_GetPropertyStr(ctx, props_obj, "type");

  if (JS_IsUndefined(type_val)) {
    JS_ThrowTypeError(ctx, "WebSG: Missing accessor type.");
    return JS_EXCEPTION;
  }

  AccessorType type = get_accessor_type_from_atom(JS_ValueToAtom(ctx, type_val));

  if (type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Invalid component type.");
    return JS_EXCEPTION;
  }

  props->type = type;

  JSValue component_type_val = JS_GetPropertyStr(ctx, props_obj, "componentType");

  if (JS_IsUndefined(component_type_val)) {
    JS_ThrowTypeError(ctx, "WebSG: Missing component type.");
    return JS_EXCEPTION;
  }

  uint32_t component_type;

  if (JS_ToUint32(ctx, &component_type, component_type_val) < 0) {
    return JS_EXCEPTION;
  }

  props->component_type = component_type;

  JSValue countVal = JS_GetPropertyStr(ctx, props_obj, "count");

  if (JS_IsUndefined(countVal)) {
    JS_ThrowTypeError(ctx, "WebSG: Missing accessor count.");
    return JS_EXCEPTION;
  }

  uint32_t count;

  if (JS_ToUint32(ctx, &count, countVal) < 0) {
    return JS_EXCEPTION;
  }

  props->count = count;

  JSValue normalized_val = JS_GetPropertyStr(ctx, props_obj, "normalized");

  if (!JS_IsUndefined(normalized_val)) {
    int normalized = JS_ToBool(ctx, normalized_val);

    if (normalized < 0) {
      return JS_EXCEPTION;
    }

    props->normalized = normalized;
  }

  JSValue dynamic_val = JS_GetPropertyStr(ctx, props_obj, "dynamic");

  if (!JS_IsUndefined(dynamic_val)) {
    int dynamic = JS_ToBool(ctx, dynamic_val);

    if (dynamic < 0) {
      return JS_EXCEPTION;
    }

    props->dynamic = dynamic;
  }

  accessor_id_t accessor_id = websg_world_create_accessor_from(data, buffer_byte_length, props);

  if (accessor_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create accessor.");
    return JS_EXCEPTION;
  }

  return js_websg_new_accessor_instance(ctx, world_data, accessor_id);
}

JSValue js_websg_world_find_accessor_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  accessor_id_t accessor_id = websg_world_find_accessor_by_name(name, length);

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_accessor_by_id(ctx, world_data, accessor_id);
}