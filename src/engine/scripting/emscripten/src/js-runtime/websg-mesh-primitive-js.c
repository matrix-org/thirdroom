#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-js.h"
#include "./websg-mesh-primitive-js.h"

static void js_websg_mesh_primitive_finalizer(JSRuntime *rt, JSValue val) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(val, websg_mesh_primitive_class_id);

  if (mesh_primitive_data) {
    js_free_rt(rt, mesh_primitive_data);
  }
}

static JSClassDef websg_mesh_primitive_class = {
  "WebSGMeshPrimitive",
  .finalizer = js_websg_mesh_primitive_finalizer
};

static JSValue js_websg_get_mesh_primitive_attribute(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  JSAtom attribute_atom = JS_ValueToAtom(ctx, argv[2]);

  if (attribute_atom == JS_ATOM_NULL) {
    JS_ThrowTypeError(ctx, "WebSG: invalid attribute type.");
    return JS_EXCEPTION;
  }

  MeshPrimitiveAttribute attribute = get_primitive_attribute_from_atom(attribute_atom);

  accessor_id_t accessor_id = websg_mesh_get_primitive_attribute(mesh_id, index, attribute);

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, accessor_id);
}

static JSValue js_websg_mesh_get_primitive_indices(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  accessor_id_t accessor_id = websg_mesh_get_primitive_indices(mesh_id, index);

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, accessor_id);
}

static JSValue js_websg_get_mesh_primitive_material(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  material_id_t material_id = websg_mesh_get_primitive_material(mesh_id, index);

  if (material_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, material_id);
}

static JSValue js_websg_get_mesh_primitive_mode(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  MeshPrimitiveMode mode = websg_mesh_get_primitive_mode(mesh_id, index);

  return JS_NewUint32(ctx, mode);
}

static JSValue js_websg_set_mesh_primitive_draw_range(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t start;

  if (JS_ToUint32(ctx, &start, argv[2]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t count;

  if (JS_ToUint32(ctx, &count, argv[3]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_mesh_set_primitive_draw_range(mesh_id, index, start, count);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting draw range.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_set_mesh_primitive_hologram_material_enabled(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int enabled = JS_ToBool(ctx, argv[2]);

  if (enabled < 0) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_mesh_set_primitive_hologram_material_enabled(mesh_id, index, enabled);

   if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting hologram material.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry websg_mesh_primitive_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGMeshPrimitive", JS_PROP_CONFIGURABLE),
};

void js_define_websg_mesh_primitive(JSContext *ctx) {
  JS_NewClassID(&websg_mesh_primitive_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_mesh_primitive_class_id, &websg_mesh_primitive_class);
  JSValue mesh_primitive_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    mesh_primitive_proto,
    websg_mesh_primitive_proto_funcs,
    countof(websg_mesh_primitive_proto_funcs)
  );
  JS_SetClassProto(ctx, websg_mesh_primitive_class_id, mesh_primitive_proto);
}

JSValue js_websg_new_mesh_primitive_instance(JSContext *ctx, WebSGContext *websg, mesh_id_t mesh_id, uint32_t index) {
  JSValue mesh_primitive = JS_NewObjectClass(ctx, websg_mesh_primitive_class_id);

  if (JS_IsException(mesh_primitive)) {
    return mesh_primitive;
  }

  WebSGMeshPrimitiveData *mesh_primitive_data = js_mallocz(ctx, sizeof(WebSGMeshPrimitiveData));
  mesh_primitive_data->mesh_id = mesh_id;
  mesh_primitive_data->index = index;

  JS_SetOpaque(mesh_primitive, mesh_primitive_data);
  
  return mesh_primitive;
}