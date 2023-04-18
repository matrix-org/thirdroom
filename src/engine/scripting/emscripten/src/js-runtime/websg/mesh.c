#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./mesh.h"
#include "./mesh-primitive.h"
#include "./accessor.h"
#include "./material.h"
#include "../utils/array.h"

JSClassID js_websg_mesh_class_id;

/**
 * Class Definition
 **/

static void js_websg_mesh_finalizer(JSRuntime *rt, JSValue val) {
  WebSGMeshData *mesh_data = JS_GetOpaque(val, js_websg_mesh_class_id);

  if (mesh_data) {
    js_free_rt(rt, mesh_data);
  }
}

static JSClassDef js_websg_mesh_class = {
  "Mesh",
  .finalizer = js_websg_mesh_finalizer
};

static JSValue js_websg_mesh_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

static const JSCFunctionListEntry js_websg_mesh_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Mesh", JS_PROP_CONFIGURABLE),
};

void js_websg_define_mesh(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_mesh_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_mesh_class_id, &js_websg_mesh_class);
  JSValue mesh_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, mesh_proto, js_websg_mesh_proto_funcs, countof(js_websg_mesh_proto_funcs));
  JS_SetClassProto(ctx, js_websg_mesh_class_id, mesh_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_mesh_constructor,
    "Mesh",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, mesh_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Mesh",
    constructor
  );
}

JSValue js_websg_new_mesh_instance(JSContext *ctx, WebSGWorldData *world_data, mesh_id_t mesh_id) {
  JSValue mesh = JS_NewObjectClass(ctx, js_websg_mesh_class_id);

  if (JS_IsException(mesh)) {
    return mesh;
  }

  WebSGMeshData *mesh_data = js_mallocz(ctx, sizeof(WebSGMeshData));
  mesh_data->world_data = world_data;
  mesh_data->mesh_id = mesh_id;
  JS_SetOpaque(mesh, mesh_data);

  JS_SetPropertyUint32(ctx, world_data->meshes, mesh_id, JS_DupValue(ctx, mesh));

  JSValue primitives_arr = JS_NewArray(ctx);

  int32_t count = websg_mesh_get_primitive_count(mesh_id);

  if (count < 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't get primitive count.");
    return JS_EXCEPTION;
  }

  for (int i = 0; i < count; i++) {
    JSValue mesh_primitive = js_websg_new_mesh_primitive_instance(ctx, world_data, mesh_id, i);

    if (JS_SetPropertyUint32(ctx, primitives_arr, i, mesh_primitive) < 0) {
      return JS_EXCEPTION;
    }
  }

  JS_SetPropertyStr(ctx, mesh, "primitives", primitives_arr);

  return mesh;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_mesh_by_id(JSContext *ctx, WebSGWorldData *world_data, mesh_id_t mesh_id) {
  JSValue mesh = JS_GetPropertyUint32(ctx, world_data->meshes, mesh_id);

  if (!JS_IsUndefined(mesh)) {
    return JS_DupValue(ctx, mesh);
  }

  return js_websg_new_mesh_instance(ctx, world_data, mesh_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  MeshProps *props = js_mallocz(ctx, sizeof(MeshProps));

  JSValue name_val = JS_GetPropertyStr(ctx, argv[0], "name");

  if (!JS_IsUndefined(name_val)) {
    props->name = JS_ToCString(ctx, name_val);

    if (props->name == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  }

  // TODO: Parse primitives array
  JSValue primitives_arr = JS_GetPropertyStr(ctx, argv[0], "primitives");

  if (JS_IsUndefined(primitives_arr)) {
    JS_ThrowTypeError(ctx, "WebSG: Mesh must have at least one primitive.");
    js_free(ctx, props);
    return JS_EXCEPTION;
  }

  if (JS_IsException(primitives_arr)) {
    js_free(ctx, props);
    return JS_EXCEPTION;
  }

  JSValue length_arr = JS_GetPropertyStr(ctx, primitives_arr, "length");

  if (JS_IsException(length_arr)) {
    js_free(ctx, props);
    return JS_EXCEPTION;
  }

  uint32_t count = 0;

  if (JS_ToUint32(ctx, &count, length_arr) == -1) {
    js_free(ctx, props);
    return JS_EXCEPTION;
  }

  if (count == 0) {
    JS_ThrowTypeError(ctx, "WebSG: Mesh must have at least one primitive.");
    js_free(ctx, props);
    return JS_EXCEPTION;
  }

  MeshPrimitiveProps *primitives = js_mallocz(ctx, sizeof(MeshPrimitiveProps) * count);
  int error = 0;

  for (int i = 0; i < count; i++) {
    JSValue primitive_obj = JS_GetPropertyUint32(ctx, primitives_arr, i);

    MeshPrimitiveProps *primitive_props = &primitives[i];

    JSValue modeVal = JS_GetPropertyStr(ctx, primitive_obj, "mode");

    uint32_t mode;

    if (!JS_IsUndefined(modeVal)) {
      if (JS_ToUint32(ctx, &mode, modeVal) == -1) {
        error = 1;
        break;
      }

      primitive_props->mode = (MeshPrimitiveMode)mode;
    } else {
      primitive_props->mode = MeshPrimitiveMode_TRIANGLES;
    }

    JSValue indices_val = JS_GetPropertyStr(ctx, primitive_obj, "indices");

    if (!JS_IsUndefined(indices_val)) {
      WebSGAccessorData *indices_data = JS_GetOpaque2(ctx, indices_val, js_websg_accessor_class_id);

      if (indices_data == NULL) {
        error = 1;
        break;
      }

      primitive_props->indices = indices_data->accessor_id;
    }

    JSValue material_val = JS_GetPropertyStr(ctx, primitive_obj, "material");

    if (!JS_IsUndefined(material_val)) {
       WebSGMaterialData *material_data = JS_GetOpaque2(ctx, material_val, js_websg_material_class_id);

      if (material_data == NULL) {
        error = 1;
        break;
      }

      primitive_props->material = material_data->material_id;
    }

    JSValue attributes_obj = JS_GetPropertyStr(ctx, primitive_obj, "attributes");

    if (!JS_IsUndefined(attributes_obj)) {
      JSPropertyEnum *attribute_props;
      uint32_t attribute_count;

      if (
        JS_GetOwnPropertyNames(
          ctx,
          &attribute_props,
          &attribute_count,
          attributes_obj,
          JS_GPN_STRING_MASK | JS_GPN_ENUM_ONLY
        )
      ) {
        error = 1;
        break;
      }

      MeshPrimitiveAttributeItem *attributes = js_mallocz(ctx, sizeof(MeshPrimitiveAttributeItem) * attribute_count);

      for(i = 0; i < attribute_count; i++) {
        JSAtom prop_name_atom = attribute_props[i].atom;
        MeshPrimitiveAttributeItem* attribute = &attributes[i];
        attribute->key = get_primitive_attribute_from_atom(prop_name_atom);
        JSValue attribute_prop = JS_GetProperty(ctx, attributes_obj, prop_name_atom);

        WebSGAccessorData *accessor_data = JS_GetOpaque2(ctx, attribute_prop, js_websg_accessor_class_id);

        if (accessor_data == NULL) {
          error = 1;
          break;
        }

        attribute->accessor_id = accessor_data->accessor_id;
      }

      primitive_props->attributes.count = attribute_count;
      primitive_props->attributes.items = attributes;

       for (uint32_t i = 0; i < attribute_count; i++) {
        JS_FreeAtom(ctx, attribute_props[i].atom);
      }

      js_free(ctx, attribute_props);
    }
  }

  props->primitives.count = count;
  props->primitives.items = primitives;

  if (error) {
    for (int primitive_idx = 0; primitive_idx < props->primitives.count; primitive_idx++) {
      MeshPrimitiveProps *primitive_props = &props->primitives.items[primitive_idx];

      if (primitive_props->attributes.count > 0) {
        js_free(ctx, primitive_props->attributes.items);
      }
    }

    js_free(ctx, props->primitives.items);
    js_free(ctx, props);

    return JS_EXCEPTION;
  }

  mesh_id_t mesh_id = websg_world_create_mesh(props);

  for (int primitive_idx = 0; primitive_idx < props->primitives.count; primitive_idx++) {
    MeshPrimitiveProps *primitive_props = &props->primitives.items[primitive_idx];

    if (primitive_props->attributes.count > 0) {
      js_free(ctx, primitive_props->attributes.items);
    }
  }

  js_free(ctx, props->primitives.items);
  js_free(ctx, props);

  if (mesh_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create mesh.");
    return JS_EXCEPTION;
  }

  return js_websg_new_mesh_instance(ctx, world_data, mesh_id);
}

JSValue js_websg_world_create_box_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  BoxMeshProps *props = js_mallocz(ctx, sizeof(BoxMeshProps));

  JSValue size_val = JS_GetPropertyStr(ctx, argv[0], "size");

  if (!JS_IsUndefined(size_val)) {
    if (js_get_float_array_like(ctx, size_val, props->size, 3) < 0) {
      return JS_EXCEPTION;
    }
  }

   JSValue segments_val = JS_GetPropertyStr(ctx, argv[0], "segments");

  if (!JS_IsUndefined(segments_val)) {
    if (js_get_int_array_like(ctx, segments_val, props->segments, 3) < 0) {
      return JS_EXCEPTION;
    }
  }

  JSValue material_val = JS_GetPropertyStr(ctx, argv[0], "material");

  if (!JS_IsUndefined(material_val)) {
      WebSGMaterialData *material_data = JS_GetOpaque2(ctx, material_val, js_websg_material_class_id);

    if (material_data == NULL) {
      return JS_EXCEPTION;
    }

    props->material = material_data->material_id;
  }

  mesh_id_t mesh_id = websg_world_create_box_mesh(props);

  if (mesh_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create box mesh.");
    return JS_EXCEPTION;
  }

  return js_websg_new_mesh_instance(ctx, world_data, mesh_id);
}

JSValue js_websg_world_find_mesh_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  mesh_id_t mesh_id = websg_world_find_mesh_by_name(name, length);

  if (mesh_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_mesh_by_id(ctx, world_data, mesh_id);
}