#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-js.h"
#include "./websg-mesh-js.h"
#include "./websg-mesh-primitive-js.h"

static void js_websg_mesh_finalizer(JSRuntime *rt, JSValue val) {
  WebSGMeshData *mesh_data = JS_GetOpaque(val, websg_mesh_class_id);

  if (mesh_data) {
    js_free_rt(rt, mesh_data);
  }
}

static JSClassDef websg_mesh_class = {
  "WebSGMesh",
  .finalizer = js_websg_mesh_finalizer
};

void js_define_websg_mesh(JSContext *ctx) {
  JS_NewClassID(&websg_mesh_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_mesh_class_id, &websg_mesh_class);
  JSValue mesh_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, mesh_proto, websg_mesh_proto_funcs, countof(websg_mesh_proto_funcs));
  JS_SetClassProto(ctx, websg_mesh_class_id, mesh_proto);
}

static const JSCFunctionListEntry websg_mesh_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGMesh", JS_PROP_CONFIGURABLE),
};

JSValue js_websg_find_mesh_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  mesh_id_t mesh_id = websg_mesh_find_by_name(name, length);

  if (mesh_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_mesh_by_id(ctx, mesh_id);
}

JSValue js_websg_new_mesh_instance(JSContext *ctx, WebSGContext *websg, mesh_id_t mesh_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue mesh = JS_NewObjectClass(ctx, websg_mesh_class_id);

  if (JS_IsException(mesh)) {
    return mesh;
  }

  WebSGMeshData *mesh_data = js_mallocz(ctx, sizeof(WebSGMeshData));
  mesh_data->mesh_id = mesh_id;
  JS_SetOpaque(mesh, mesh_data);

  JS_SetPropertyUint32(ctx, websg->meshes, mesh_id, JS_DupValue(ctx, mesh));

  JSValue primitives_arr = JS_NewArray(ctx);

  int32_t count = websg_mesh_get_primitive_count(mesh_id);

  if (count < 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't get primitive count.");
    return JS_EXCEPTION;
  }

  for (int i = 0; i < count; i++) {
    JSValue mesh_primitive = js_websg_new_mesh_primitive_instance(ctx, websg, mesh_id, i);

    if (JS_SetPropertyUint32(ctx, primitives_arr, i, mesh_primitive) < 0) {
      return JS_EXCEPTION;
    }
  }

  JS_SetPropertyStr(ctx, mesh, "primitives", primitives_arr);

  return mesh;
}

JSValue js_websg_create_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

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

  return js_websg_new_mesh_instance(ctx, websg, mesh_id);
}

JSValue js_websg_create_box_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  BoxMeshProps *props = js_mallocz(ctx, sizeof(BoxMeshProps));

  JSValue size_val = JS_GetPropertyStr(ctx, argv[0], "size");

  if (!JS_IsUndefined(size_val)) {
    float_t *size = get_typed_array_data(ctx, &size_val, sizeof(float_t) * 3);

    if (size == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->size, size, sizeof(float_t) * 3);
  }

   JSValue segments_val = JS_GetPropertyStr(ctx, argv[0], "segments");

  if (!JS_IsUndefined(segments_val)) {
    uint32_t *segments = get_typed_array_data(ctx, &segments_val, sizeof(uint32_t) * 3);

    if (segments == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->segments, segments, sizeof(uint32_t) * 3);
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

  return js_websg_new_mesh_instance(ctx, websg, mesh_id);
}

JSValue js_websg_get_mesh_by_id(JSContext *ctx, mesh_id_t mesh_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue mesh = JS_GetPropertyUint32(ctx, websg->meshes, mesh_id);

  if (!JS_IsUndefined(mesh)) {
    return JS_DupValue(ctx, mesh);
  }

  return js_websg_new_mesh_instance(ctx, websg, mesh_id);
}
