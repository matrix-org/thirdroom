#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./mesh-primitive.h"
#include "./material.h"
#include "./accessor.h"

JSClassID js_websg_mesh_primitive_class_id;

/**
 * Private Methods and Variables
 **/

JSAtom POSITION;
JSAtom NORMAL;
JSAtom TANGENT;
JSAtom TEXCOORD_0;
JSAtom TEXCOORD_1;
JSAtom COLOR_0;
JSAtom JOINTS_0;
JSAtom WEIGHTS_0;

MeshPrimitiveAttribute get_primitive_attribute_from_atom(JSAtom atom) {
  if (atom == POSITION) {
    return MeshPrimitiveAttribute_POSITION;
  } else if (atom == NORMAL) {
    return MeshPrimitiveAttribute_NORMAL;
  } else if (atom == TANGENT) {
    return MeshPrimitiveAttribute_TANGENT;
  } else if (atom == TEXCOORD_0) {
    return MeshPrimitiveAttribute_TEXCOORD_0;
  } else if (atom == TEXCOORD_1) {
    return MeshPrimitiveAttribute_TEXCOORD_1;
  } else if (atom == COLOR_0) {
    return MeshPrimitiveAttribute_COLOR_0;
  } else if (atom == JOINTS_0) {
    return MeshPrimitiveAttribute_JOINTS_0;
  } else if (atom == WEIGHTS_0) {
    return MeshPrimitiveAttribute_WEIGHTS_0;
  } else {
    return -1;
  }
}

static void js_websg_mesh_primitive_finalizer(JSRuntime *rt, JSValue val) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(val, js_websg_mesh_primitive_class_id);

  if (mesh_primitive_data) {
    js_free_rt(rt, mesh_primitive_data);
  }
}

static JSClassDef js_websg_mesh_primitive_class = {
  "MeshPrimitive",
  .finalizer = js_websg_mesh_primitive_finalizer
};

static JSValue js_websg_get_mesh_primitive_attribute(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  JSAtom attribute_atom = JS_ValueToAtom(ctx, argv[0]);

  if (attribute_atom == JS_ATOM_NULL) {
    JS_ThrowTypeError(ctx, "WebSG: invalid attribute type.");
    return JS_EXCEPTION;
  }

  MeshPrimitiveAttribute attribute = get_primitive_attribute_from_atom(attribute_atom);

  accessor_id_t accessor_id = websg_mesh_get_primitive_attribute(
    mesh_primitive_data->mesh_id,
    mesh_primitive_data->index,
    attribute
  );

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_accessor_by_id(ctx, mesh_primitive_data->world_data, accessor_id);
}

static JSValue js_websg_mesh_get_primitive_indices(
  JSContext *ctx,
  JSValueConst this_val
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  accessor_id_t accessor_id = websg_mesh_get_primitive_indices(
    mesh_primitive_data->mesh_id,
    mesh_primitive_data->index
  );

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_accessor_by_id(ctx, mesh_primitive_data->world_data, accessor_id);
}

static JSValue js_websg_get_mesh_primitive_material(
  JSContext *ctx,
  JSValueConst this_val
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  material_id_t material_id = websg_mesh_get_primitive_material(
    mesh_primitive_data->mesh_id,
    mesh_primitive_data->index
  );

  if (material_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_material_by_id(ctx, mesh_primitive_data->world_data, material_id);
}

static JSValue js_websg_set_mesh_primitive_material(
  JSContext *ctx,
  JSValueConst this_val,
  JSValueConst arg
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  WebSGMaterialData *material_data = JS_GetOpaque2(ctx, arg, js_websg_material_class_id);

  if (material_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_mesh_set_primitive_material(
    mesh_primitive_data->mesh_id,
    mesh_primitive_data->index,
    material_data->material_id
  ) < 0) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting mesh primitive material.");
    return JS_EXCEPTION;
  }

  if (material_data->material_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_get_mesh_primitive_mode(
  JSContext *ctx,
  JSValueConst this_val
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  MeshPrimitiveMode mode = websg_mesh_get_primitive_mode(mesh_primitive_data->mesh_id, mesh_primitive_data->index);

  return JS_NewUint32(ctx, mode);
}

static JSValue js_websg_mesh_primitive_set_draw_range(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  uint32_t start;

  if (JS_ToUint32(ctx, &start, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t count;

  if (JS_ToUint32(ctx, &count, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_mesh_set_primitive_draw_range(
    mesh_primitive_data->mesh_id,
    mesh_primitive_data->index,
    start,
    count
  );

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting draw range.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_set_mesh_primitive_hologram_material_enabled(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGMeshPrimitiveData *mesh_primitive_data = JS_GetOpaque(this_val, js_websg_mesh_primitive_class_id);

  int enabled = JS_ToBool(ctx, argv[0]);

  if (enabled < 0) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_mesh_set_primitive_hologram_material_enabled(
    mesh_primitive_data->mesh_id,
    mesh_primitive_data->index,
    enabled
  );

   if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting hologram material.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static const JSCFunctionListEntry js_websg_mesh_primitive_proto_funcs[] = {
  JS_CGETSET_DEF("indices", js_websg_mesh_get_primitive_indices, NULL),
  JS_CFUNC_DEF("getAttribute", 1, js_websg_get_mesh_primitive_attribute),
  JS_CGETSET_DEF("material", js_websg_get_mesh_primitive_material, js_websg_set_mesh_primitive_material),
  JS_CGETSET_DEF("mode", js_websg_get_mesh_primitive_mode, NULL),
  JS_CFUNC_DEF("setDrawRange", 2, js_websg_mesh_primitive_set_draw_range),
  JS_CFUNC_DEF("thirdroomSetHologramMaterialEnabled", 1, js_websg_set_mesh_primitive_hologram_material_enabled),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "MeshPrimitive", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_mesh_primitive_constructor(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_mesh_primitive(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_mesh_primitive_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_mesh_primitive_class_id, &js_websg_mesh_primitive_class);
  JSValue mesh_primitive_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    mesh_primitive_proto,
    js_websg_mesh_primitive_proto_funcs,
    countof(js_websg_mesh_primitive_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_mesh_primitive_class_id, mesh_primitive_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_mesh_primitive_constructor,
    "MeshPrimitive",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, mesh_primitive_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "MeshPrimitive",
    constructor
  );

  POSITION = JS_NewAtom(ctx, "POSITION");
  NORMAL = JS_NewAtom(ctx, "NORMAL");
  TANGENT = JS_NewAtom(ctx, "TANGENT");
  TEXCOORD_0 = JS_NewAtom(ctx, "TEXCOORD_0");
  TEXCOORD_1 = JS_NewAtom(ctx, "TEXCOORD_1");
  COLOR_0 = JS_NewAtom(ctx, "COLOR_0");
  JOINTS_0 = JS_NewAtom(ctx, "JOINTS_0");
  WEIGHTS_0 = JS_NewAtom(ctx, "WEIGHTS_0");

  JSValue mesh_primitive_attribute = JS_NewObject(ctx);
  JS_SetProperty(ctx, mesh_primitive_attribute, POSITION, JS_AtomToValue(ctx, POSITION));
  JS_SetProperty(ctx, mesh_primitive_attribute, NORMAL, JS_AtomToValue(ctx, NORMAL));
  JS_SetProperty(ctx, mesh_primitive_attribute, TEXCOORD_0, JS_AtomToValue(ctx, TEXCOORD_0));
  JS_SetProperty(ctx, mesh_primitive_attribute, TEXCOORD_1, JS_AtomToValue(ctx, TEXCOORD_1));
  JS_SetProperty(ctx, mesh_primitive_attribute, COLOR_0, JS_AtomToValue(ctx, COLOR_0));
  JS_SetProperty(ctx, mesh_primitive_attribute, JOINTS_0, JS_AtomToValue(ctx, JOINTS_0));
  JS_SetProperty(ctx, mesh_primitive_attribute, WEIGHTS_0, JS_AtomToValue(ctx, WEIGHTS_0));
  JS_SetPropertyStr(ctx, websg, "MeshPrimitiveAttribute", mesh_primitive_attribute);

  JSValue mesh_primitive_mode = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "POINTS", JS_NewUint32(ctx, 0));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "LINES", JS_NewUint32(ctx, 1));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "LINE_LOOP", JS_NewUint32(ctx, 2));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "LINE_STRIP", JS_NewUint32(ctx, 3));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "TRIANGLES", JS_NewUint32(ctx, 4));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "TRIANGLE_STRIP", JS_NewUint32(ctx, 5));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "TRIANGLE_FAN", JS_NewUint32(ctx, 6));
  JS_SetPropertyStr(ctx, websg, "MeshPrimitiveMode", mesh_primitive_mode);
}

/**
 * Public Methods
 **/

JSValue js_websg_new_mesh_primitive_instance(
  JSContext *ctx,
  WebSGWorldData *world_data,
  mesh_id_t mesh_id,
  uint32_t index
) {
  JSValue mesh_primitive = JS_NewObjectClass(ctx, js_websg_mesh_primitive_class_id);

  if (JS_IsException(mesh_primitive)) {
    return mesh_primitive;
  }

  WebSGMeshPrimitiveData *mesh_primitive_data = js_mallocz(ctx, sizeof(WebSGMeshPrimitiveData));
  mesh_primitive_data->mesh_id = mesh_id;
  mesh_primitive_data->index = index;

  JS_SetOpaque(mesh_primitive, mesh_primitive_data);
  
  return mesh_primitive;
}