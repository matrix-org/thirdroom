#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./material.h"
#include "./rgba.h"
#include "./rgb.h"
#include "./texture.h"

/**
 * Private Methods and Variables
 **/

JSAtom standard;
JSAtom unlit;

MaterialType get_material_type_from_atom(JSAtom atom) {
  if (atom == standard) {
    return MaterialType_Standard;
  } else if (atom == unlit) {
    return MaterialType_Unlit;
  } else {
    return -1;
  }
}

/**
 * Class Definition
 **/

static void js_websg_material_finalizer(JSRuntime *rt, JSValue val) {
  WebSGMaterialData *material_data = JS_GetOpaque(val, js_websg_material_class_id);

  if (material_data) {
    js_free_rt(rt, material_data);
  }
}

static JSClassDef js_websg_material_class = {
  "Material",
  .finalizer = js_websg_material_finalizer
};

static float_t js_websg_material_get_base_color_factor_element(uint32_t material_id, float_t *color, int index) {
  websg_material_get_base_color_factor(material_id, color);
  return color[index];
}

static void js_websg_material_set_base_color_factor_element(
  uint32_t material_id,
  float_t *color,
  int index,
  float_t value
) {
  websg_material_get_base_color_factor(material_id, color);
  color[index] = value;
  websg_material_set_base_color_factor(material_id, color);
}

static JSValue js_material_get_metallic_factor(JSContext *ctx, JSValueConst this_val) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  float_t result = websg_material_get_metallic_factor(material_data->material_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_material_set_metallic_factor(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_material_set_metallic_factor(material_data->material_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting metallicFactor.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_material_get_roughness_factor(JSContext *ctx, JSValueConst this_val) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  float_t result = websg_material_get_roughness_factor(material_data->material_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_material_set_roughness_factor(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_material_set_roughness_factor(material_data->material_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting roughnessFactor.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static float_t js_websg_material_get_emissive_factor_element(uint32_t material_id, float_t *color, int index) {
  websg_material_get_emissive_factor(material_id, color);
  return color[index];
}

static void js_websg_material_set_emissive_factor_element(
  uint32_t material_id,
  float_t *color,
  int index,
  float_t value
) {
  websg_material_get_emissive_factor(material_id, color);
  color[index] = value;
  websg_material_set_emissive_factor(material_id, color);
}

static JSValue js_material_get_base_color_texture(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  texture_id_t texture_id = websg_material_get_base_color_texture(material_data->material_id);

  if (texture_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_texture_by_id(ctx, material_data->world_data, texture_id);
}

static JSValue js_material_set_base_color_texture(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  WebSGTextureData *texture_data = JS_GetOpaque2(ctx, argv[0], js_websg_texture_class_id);

  int32_t result = websg_material_set_base_color_texture(material_data->material_id, texture_data->texture_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting texture.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_material_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Material", JS_PROP_CONFIGURABLE),
};

void js_websg_define_material(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_material_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_material_class_id, &js_websg_material_class);
  JSValue material_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    material_proto,
    js_websg_material_proto_funcs,
    countof(js_websg_material_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_material_class_id, material_proto);

  standard = JS_NewAtom(ctx, "standard");
  unlit = JS_NewAtom(ctx, "unlit");

  JSValue material_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, material_type, "Standard", JS_AtomToValue(ctx, standard));
  JS_SetPropertyStr(ctx, material_type, "Unlit", JS_AtomToValue(ctx, unlit));
  JS_SetPropertyStr(ctx, websg, "MaterialType", material_type);
}

JSValue js_websg_new_material_instance(JSContext *ctx, WebSGWorldData *world_data, material_id_t material_id) {
  JSValue material = JS_NewObjectClass(ctx, js_websg_material_class_id);

  if (JS_IsException(material)) {
    return material;
  }

  js_websg_define_rgba_prop(
    ctx,
    material,
    "baseColorFactor",
    material_id,
    &js_websg_material_get_base_color_factor_element,
    &js_websg_material_set_base_color_factor_element
  );

  js_websg_define_rgb_prop(
    ctx,
    material,
    "emissiveFactor",
    material_id,
    &js_websg_material_get_emissive_factor_element,
    &js_websg_material_set_emissive_factor_element
  );

  WebSGMaterialData *material_data = js_mallocz(ctx, sizeof(WebSGMaterialData));
  material_data->world_data = world_data;
  material_data->material_id = material_id;
  JS_SetOpaque(material, material_data);
  
  return material;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_material_by_id(JSContext *ctx, WebSGWorldData *world_data, material_id_t material_id) {
  JSValue material = JS_GetPropertyUint32(ctx, world_data->materials, material_id);

  if (!JS_IsUndefined(material)) {
    return JS_DupValue(ctx, material);
  }

  return js_websg_new_material_instance(ctx, world_data, material_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  MaterialType material_type;
  
  if (JS_IsUndefined(argv[0])) {
    material_type = MaterialType_Standard;
  } else {
    material_type = get_material_type_from_atom(JS_ValueToAtom(ctx, argv[0]));
  }

  if (material_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown material type.");
    return JS_EXCEPTION;
  }

  material_id_t material_id = websg_create_material(material_type);

  if (material_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create material.");
    return JS_EXCEPTION;
  }

  return js_websg_new_material_instance(ctx, world_data, material_id);
}

JSValue js_websg_world_find_material_by_name(
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

  material_id_t material_id = websg_material_find_by_name(name, length);

  if (material_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_material_by_id(ctx, world_data, material_id);
}