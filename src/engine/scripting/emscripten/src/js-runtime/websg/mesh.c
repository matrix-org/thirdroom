#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./mesh.h"
#include "./mesh-primitive.h"
#include "../utils/array.h"

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

  JSValue lengthVal = JS_GetPropertyStr(ctx, argv[0], "length");

  if (JS_IsException(lengthVal)) {
    return JS_EXCEPTION;
  }

  uint32_t count = 0;

  if (JS_ToUint32(ctx, &count, lengthVal) == -1) {
    return JS_EXCEPTION;
  }

  JSValue primitives_arr = argv[0];
  MeshPrimitiveProps *primitives = js_mallocz(ctx, sizeof(MeshPrimitiveProps) * count);

  for (int i = 0; i < count; i++) {
    JSValue primitive_obj = JS_GetPropertyUint32(ctx, primitives_arr, i);

    MeshPrimitiveProps *props = &primitives[i];

    JSValue modeVal = JS_GetPropertyStr(ctx, primitive_obj, "mode");

    uint32_t mode;

    if (!JS_IsUndefined(modeVal)) {
      if (JS_ToUint32(ctx, &mode, modeVal) == -1) {
        return JS_EXCEPTION;
      }

      props->mode = (MeshPrimitiveMode)mode;
    } else {
      props->mode = MeshPrimitiveMode_TRIANGLES;
    }

    JSValue indicesVal = JS_GetPropertyStr(ctx, primitive_obj, "indices");

    if (!JS_IsUndefined(indicesVal)) {
      if (JS_ToUint32(ctx, &props->indices, indicesVal) == -1) {
        return JS_EXCEPTION;
      }
    }

    JSValue materialVal = JS_GetPropertyStr(ctx, primitive_obj, "material");

    if (!JS_IsUndefined(materialVal)) {
      if (JS_ToUint32(ctx, &props->material, materialVal) == -1) {
        return JS_EXCEPTION;
      }
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
        return JS_EXCEPTION;
      }

      MeshPrimitiveAttributeItem *attributes = js_mallocz(ctx, sizeof(MeshPrimitiveAttributeItem) * attribute_count);

      for(i = 0; i < attribute_count; i++) {
        JSAtom prop_name_atom = attribute_props[i].atom;
        MeshPrimitiveAttributeItem* attribute = &attributes[i];
        attribute->key = get_primitive_attribute_from_atom(prop_name_atom);
        JSValue attribute_prop = JS_GetProperty(ctx, attributes_obj, prop_name_atom);

        if (JS_ToUint32(ctx, &attribute->accessor_id, attribute_prop) == -1) {
          return JS_EXCEPTION;
        }
      }

      props->attribute_count = attribute_count;
      props->attributes = attributes;

      for(uint32_t i = 0; i < attribute_count; i++) {
        JS_FreeAtom(ctx, attribute_props[i].atom);
      }

      js_free(ctx, attribute_props);
    }
  }

  mesh_id_t mesh_id = websg_create_mesh(primitives, count);

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

  JSValue materialVal = JS_GetPropertyStr(ctx, argv[0], "material");

  if (!JS_IsUndefined(materialVal)) {
    if (JS_ToUint32(ctx, &props->material, materialVal) == -1) {
      return JS_EXCEPTION;
    }
  }

  mesh_id_t mesh_id = websg_create_box_mesh(props);

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

  mesh_id_t mesh_id = websg_mesh_find_by_name(name, length);

  if (mesh_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_mesh_by_id(ctx, world_data, mesh_id);
}