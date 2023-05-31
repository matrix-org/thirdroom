#include <string.h>
#include <stdlib.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./component.h"
#include "./vector2.h"
#include "./vector3.h"
#include "./vector4.h"
#include "./rgb.h"
#include "./rgba.h"
#include "./node.h"

JSClassID js_websg_component_class_id;

/**
 * Class Definition
 **/

void js_websg_component_finalizer(JSRuntime *rt, JSValue val) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(val);

  if (component_data) {
    JS_FreeValueRT(rt, component_data->private_fields);
    js_free_rt(rt, component_data);
  }
}

static JSClassDef js_websg_component_class = {
  "Component",
  .finalizer = js_websg_component_finalizer
};

static const JSCFunctionListEntry js_websg_component_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Component", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_component_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_component(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_component_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_component_class_id, &js_websg_component_class);
  JSValue component_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    component_proto,
    js_websg_component_proto_funcs,
    countof(js_websg_component_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_component_class_id, component_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_component_constructor,
    "Component",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, component_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Component",
    constructor
  );
}

// int js_define_property_get_set_magic(
//   JSContext *ctx,
//   JSValue obj,
//   const char *prop_name,
//   JSCFunctionMagic *getter_fn,
//   JSCFunctionMagic *setter_fn,
//   int32_t magic
// ) {
//   char buf[64];

//   snprintf(buf, sizeof(buf), "get %s", prop_name);

//   JSValue getter = JS_NewCFunction2(
//     ctx,
//     getter_fn,
//     buf,
//     0,
//     JS_CFUNC_getter_magic,
//     magic
//   );

//   JSValue setter = JS_UNDEFINED;

//   if (setter_fn != NULL) {
//     snprintf(buf, sizeof(buf), "set %s", prop_name);

//     setter = JS_NewCFunction2(
//       ctx,
//       setter_fn,
//       buf,
//       1,
//       JS_CFUNC_setter_magic,
//       magic
//     );
//   }
  
//   return JS_DefinePropertyGetSet(
//     ctx,
//     obj,
//     JS_NewAtom(ctx, prop_name),
//     getter,
//     setter,
//     JS_PROP_CONFIGURABLE
//   );
// }

static JSValue js_websg_component_get_bool_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(int32_t) * component_data->component_store_index;
  int32_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
  return JS_NewBool(ctx, *value_ptr);
}

static JSValue js_websg_component_set_bool_prop(
  JSContext *ctx,
  JSValueConst this_val,
  JSValueConst arg,
  int prop_idx
) {
  int32_t value = JS_ToBool(ctx, arg);

  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(int32_t) * component_data->component_store_index;
  int32_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;

  *value_ptr = value;

  return JS_UNDEFINED;
}

static JSValue js_websg_component_get_i32_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(int32_t) * component_data->component_store_index;
  int32_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
  return JS_NewInt32(ctx, *value_ptr);
}

static JSValue js_websg_component_set_i32_prop(
  JSContext *ctx,
  JSValueConst this_val,
  JSValueConst arg,
  int prop_idx
) {
  int32_t value;
  
  if (JS_ToInt32(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(int32_t) * component_data->component_store_index;
  int32_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;

  *value_ptr = value;

  return JS_UNDEFINED;
}

static JSValue js_websg_component_get_u32_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(uint32_t) * component_data->component_store_index;
  uint32_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
  return JS_NewUint32(ctx, *value_ptr);
}

static JSValue js_websg_component_set_u32_prop(
  JSContext *ctx,
  JSValueConst this_val,
  JSValueConst arg,
  int prop_idx
) {
  uint32_t value;
  
  if (JS_ToUint32(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(uint32_t) * component_data->component_store_index;
  uint32_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;

  *value_ptr = value;

  return JS_UNDEFINED;
}

static JSValue js_websg_component_get_f32_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(float_t) * component_data->component_store_index;
  float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
  return JS_NewFloat64(ctx, *value_ptr);
}

static JSValue js_websg_component_set_f32_prop(
  JSContext *ctx,
  JSValueConst this_val,
  JSValueConst arg,
  int prop_idx
) {
  double value;
  
  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(float_t) * component_data->component_store_index;
  float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;

  *value_ptr = (float_t)value;

  return JS_UNDEFINED;
}

static JSValue js_websg_component_get_node_ref_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(node_id_t) * component_data->component_store_index;
  node_id_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
  
  node_id_t node_id = *value_ptr;

  if (node_id == 0) {
    return JS_UNDEFINED;
  } else {
    return js_websg_get_node_by_id(ctx, store_data->world_data, *value_ptr);
  }
}

static JSValue js_websg_component_set_node_ref_prop(
  JSContext *ctx,
  JSValueConst this_val,
  JSValueConst arg,
  int prop_idx
) {
  node_id_t value;

  if (JS_IsUndefined(arg)) {
    value = 0;
  } else {
    WebSGNodeData *node_data = JS_GetOpaque2(ctx, arg, js_websg_node_class_id);
    value = node_data->node_id;
  }

  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;
  size_t node_offset = sizeof(node_id_t) * component_data->component_store_index;
  node_id_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;

  *value_ptr = value;

  return JS_UNDEFINED;
}

static JSValue js_websg_component_get_vec2_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;

  JSValue prop_val = JS_GetPropertyUint32(ctx, component_data->private_fields, prop_idx);

  if (JS_IsUndefined(prop_val)) {
    size_t node_offset = sizeof(float_t) * 2 * component_data->component_store_index;
    float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
    prop_val = js_websg_create_vector2(ctx, value_ptr);
    JS_SetPropertyUint32(ctx, component_data->private_fields, prop_idx, prop_val);
  }

  return JS_DupValue(ctx, prop_val);
}

static JSValue js_websg_component_get_vec3_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;

  JSValue prop_val = JS_GetPropertyUint32(ctx, component_data->private_fields, prop_idx);

  if (JS_IsUndefined(prop_val)) {
    size_t node_offset = sizeof(float_t) * 3 * component_data->component_store_index;
    float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
    prop_val = js_websg_create_vector3(ctx, value_ptr);
    JS_SetPropertyUint32(ctx, component_data->private_fields, prop_idx, prop_val);
  }

  return JS_DupValue(ctx, prop_val);
}

static JSValue js_websg_component_get_vec4_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;

  JSValue prop_val = JS_GetPropertyUint32(ctx, component_data->private_fields, prop_idx);

  if (JS_IsUndefined(prop_val)) {
    size_t node_offset = sizeof(float_t) * 4 * component_data->component_store_index;
    float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
    prop_val = js_websg_create_vector4(ctx, value_ptr);
    JS_SetPropertyUint32(ctx, component_data->private_fields, prop_idx, prop_val);
  }

  return JS_DupValue(ctx, prop_val);
}

static JSValue js_websg_component_get_rgb_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;

  JSValue prop_val = JS_GetPropertyUint32(ctx, component_data->private_fields, prop_idx);

  if (JS_IsUndefined(prop_val)) {
    size_t node_offset = sizeof(float_t) * 3 * component_data->component_store_index;
    float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
    prop_val = js_websg_create_rgb(ctx, value_ptr);
    JS_SetPropertyUint32(ctx, component_data->private_fields, prop_idx, prop_val);
  }

  return JS_DupValue(ctx, prop_val);
}

static JSValue js_websg_component_get_rgba_prop(JSContext *ctx, JSValueConst this_val, int prop_idx) {
  WebSGComponentData *component_data = JS_GetOpaque_UNSAFE(this_val);
  WebSGComponentStoreData *store_data = component_data->component_store_data;

  JSValue prop_val = JS_GetPropertyUint32(ctx, component_data->private_fields, prop_idx);

  if (JS_IsUndefined(prop_val)) {
    size_t node_offset = sizeof(float_t) * 4 * component_data->component_store_index;
    float_t *value_ptr = store_data->store + store_data->prop_byte_offsets[prop_idx] + node_offset;
    prop_val = js_websg_create_rgba(ctx, value_ptr);
    JS_SetPropertyUint32(ctx, component_data->private_fields, prop_idx, prop_val);
  }

  return JS_DupValue(ctx, prop_val);
}

JSClassID js_websg_define_component_instance(
  JSContext *ctx,
  component_id_t component_id,
  uint32_t component_store_size,
  size_t *component_store_byte_length,
  uint32_t **prop_byte_offsets
) {
  uint32_t component_name_length = websg_component_definition_get_name_length(component_id);

  if (component_name_length == 0) {
    JS_ThrowInternalError(ctx, "Failed to get component name length");
    return 0;
  }

  const char *component_name = js_mallocz(ctx, sizeof(char) * component_name_length);

  if (websg_component_definition_get_name(component_id, component_name, component_name_length) == -1) {
    JS_ThrowInternalError(ctx, "Failed to get component name");
    return 0;
  }

  int32_t prop_count = websg_component_definition_get_prop_count(component_id);

  if (prop_count == -1) {
    JS_ThrowInternalError(ctx, "Failed to get component prop count");
    return 0;
  }

  JSClassDef *class_def = js_mallocz(ctx, sizeof(JSClassDef));
  class_def->class_name = component_name;
  class_def->finalizer = js_websg_component_finalizer;

  JSClassID component_instance_class_id = 0;
  JS_NewClassID(&component_instance_class_id);
  JS_NewClass(JS_GetRuntime(ctx), component_instance_class_id, class_def);
  JSValue component_instance_proto = JS_NewObject(ctx);
  JSValue component_proto = JS_GetClassProto(ctx, js_websg_component_class_id);

  int32_t byte_offset = 0;
  uint32_t *prop_byte_offsets_arr = NULL;

  if (prop_count > 0) {
    JSCFunctionListEntry *function_list = js_mallocz(ctx, sizeof(JSCFunctionListEntry) * prop_count);

    prop_byte_offsets_arr = js_mallocz(ctx, sizeof(uint32_t) * prop_count);

    for (int32_t i = 0; i < prop_count; i++) {
      uint32_t prop_name_length = websg_component_definition_get_prop_name_length(component_id, i);

      if (prop_name_length == 0) {
        JS_ThrowInternalError(ctx, "Failed to get prop name length");
        return 0;
      }

      const char *prop_name = js_mallocz(ctx, sizeof(char) * prop_name_length);

      if (websg_component_definition_get_prop_name(component_id, i, prop_name, prop_name_length) == -1) {
        JS_ThrowInternalError(ctx, "Failed to get prop name");
        return 0;
      }

      uint32_t prop_type_length = websg_component_definition_get_prop_type_length(component_id, i);

      if (prop_type_length == 0) {
        JS_ThrowInternalError(ctx, "Failed to get prop type length");
        return 0;
      }

      const char *prop_type = js_mallocz(ctx, sizeof(char) * prop_type_length);

      if (websg_component_definition_get_prop_type(component_id, i, prop_type, prop_type_length) == -1) {
        JS_ThrowInternalError(ctx, "Failed to get prop type");
        return 0;
      }

      const char *ref_type;

      if (strcmp(prop_type, "ref") == 0) {
        uint32_t ref_type_length = websg_component_definition_get_ref_type_length(component_id, i);

        if (ref_type_length == 0) {
          JS_ThrowInternalError(ctx, "Failed to get ref type length");
          return 0;
        }

        const char *ref_type = js_mallocz(ctx, sizeof(char) * ref_type_length);

        if (websg_component_definition_get_ref_type(component_id, i, ref_type, ref_type_length) == -1) {
          JS_ThrowInternalError(ctx, "Failed to get ref type");
          return 0;
        }
      } else {
        ref_type = NULL;
      }

      ComponentPropStorageType storage_type = websg_component_definition_get_prop_storage_type(component_id, i);

      if (storage_type == -1) {
        JS_ThrowInternalError(ctx, "Failed to get prop storage type");
        return 0;
      }

      int32_t prop_size = websg_component_definition_get_prop_size(component_id, i);

      if (prop_size < 1) {
        JS_ThrowInternalError(ctx, "Failed to get prop size");
        return 0;
      }

      // All props are 4 byte aligned
      int32_t prop_byte_length = 4 * prop_size;
      int32_t store_byte_length = prop_byte_length * component_store_size;

      JSCFunctionListEntry entry;

      if (prop_size == 1) {
        if (strcmp(prop_type, "bool") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_bool_prop,
            js_websg_component_set_bool_prop,
            i
          );
        } else if (strcmp(prop_type, "i32") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_i32_prop,
            js_websg_component_set_i32_prop,
            i
          );
        } else if (strcmp(prop_type, "f32") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_f32_prop,
            js_websg_component_set_f32_prop,
            i
          );
        } else if (strcmp(prop_type, "ref") == 0) {
          if (strcmp(ref_type, "node") == 0) {
            entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
              prop_name,
              js_websg_component_get_node_ref_prop,
              js_websg_component_set_node_ref_prop,
              i
            );
          } else {
            JS_ThrowInternalError(ctx, "Unknown ref type.");
            return 0;
          }
        } else if (storage_type == ComponentPropStorageType_i32) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_i32_prop,
            js_websg_component_set_i32_prop,
            i
          );
        } else if (storage_type == ComponentPropStorageType_u32) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_u32_prop,
            js_websg_component_set_u32_prop,
            i
          );
        } else if (storage_type == ComponentPropStorageType_f32) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_f32_prop,
            js_websg_component_set_f32_prop,
            i
          );
        } else {
          JS_ThrowInternalError(ctx, "Invalid prop storage type");
          return 0;
        }
      } else {
        if (strcmp(prop_type, "vec2") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_vec2_prop,
            NULL,
            i
          );
        } else if (strcmp(prop_type, "vec3") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_vec3_prop,
            NULL,
            i
          );
        } else if (strcmp(prop_type, "vec4") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_vec4_prop,
            NULL,
            i
          );
        } else if (strcmp(prop_type, "rgb") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_rgb_prop,
            NULL,
            i
          );
        } else if (strcmp(prop_type, "rgba") == 0) {
          entry = (JSCFunctionListEntry)JS_CGETSET_MAGIC_DEF(
            prop_name,
            js_websg_component_get_rgba_prop,
            NULL,
            i
          );
        // TODO: Figure out how to handle typed arrays with size defined by prop size.
        // } else if (storage_type == ComponentPropStorageType_i32) {
        //   js_websg_define_component_i32_array_prop(
        //     ctx,
        //     component_instance_proto,
        //     prop_name,
        //     byte_offset,
        //     prop_size
        //   );
        // } else if (storage_type == ComponentPropStorageType_u32) {
        //   js_websg_define_component_u32_array_prop(
        //     ctx,
        //     component_instance_proto,
        //     prop_name,
        //     byte_offset,
        //     prop_size
        //   );
        // } else if (storage_type == ComponentPropStorageType_f32) {
        //   js_websg_define_component_f32_array_prop(
        //     ctx,
        //     component_instance_proto,
        //     prop_name,
        //     byte_offset,
        //     prop_size
        //   );
        } else {
          JS_ThrowInternalError(ctx, "Invalid prop storage type");
          return 0;
        }
      }

      memcpy(
        &function_list[i],
        &entry,
        sizeof(JSCFunctionListEntry)
      );

      prop_byte_offsets_arr[i] = byte_offset;

      byte_offset += store_byte_length;
    }

    JS_SetPropertyFunctionList(ctx, component_instance_proto, function_list, prop_count);
  }

  JS_SetPrototype(ctx, component_instance_proto, component_proto);
  JS_SetClassProto(ctx, component_instance_class_id, component_instance_proto);

  *component_store_byte_length = (size_t)byte_offset;
  *prop_byte_offsets = prop_byte_offsets_arr;

  return component_instance_class_id;
}

JSValue js_websg_create_component_instance(
  JSContext *ctx,
  WebSGComponentStoreData *component_store_data,
  uint32_t component_store_index
) {
  JSValue component_instance = JS_NewObjectClass(ctx, component_store_data->component_instance_class_id);
  WebSGComponentData *component_data = js_mallocz(ctx, sizeof(WebSGComponentData));
  component_data->component_store_data = component_store_data;
  component_data->component_store_index = component_store_index;
  component_data->private_fields = JS_NewObject(ctx);
  JS_SetOpaque(component_instance, component_data);
  return component_instance;
}