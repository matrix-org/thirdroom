#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./material.h"
#include "./rgba.h"
#include "./rgb.h"
#include "./texture.h"
#include "../utils/array.h"

JSClassID js_websg_material_class_id;

/**
 * Private Methods and Variables
 **/

JSAtom opaque;
JSAtom mask;
JSAtom blend;

MaterialAlphaMode get_alpha_mode_from_atom(JSAtom atom) {
  if (atom == opaque) {
    return MaterialAlphaMode_OPAQUE;
  } else if (atom == mask) {
    return MaterialAlphaMode_MASK;
  } else if (atom == blend) {
    return MaterialAlphaMode_BLEND;
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

static JSValue js_websg_material_get_metallic_factor(JSContext *ctx, JSValueConst this_val) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  float_t result = websg_material_get_metallic_factor(material_data->material_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_material_set_metallic_factor(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
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

static JSValue js_websg_material_get_roughness_factor(JSContext *ctx, JSValueConst this_val) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  float_t result = websg_material_get_roughness_factor(material_data->material_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_material_set_roughness_factor(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
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

static JSValue js_websg_material_get_base_color_texture(JSContext *ctx, JSValueConst this_val) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  texture_id_t texture_id = websg_material_get_base_color_texture(material_data->material_id);

  if (texture_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_texture_by_id(ctx, material_data->world_data, texture_id);
}

static JSValue js_websg_material_set_base_color_texture(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGMaterialData *material_data = JS_GetOpaque(this_val, js_websg_material_class_id);

  WebSGTextureData *texture_data = JS_GetOpaque2(ctx, arg, js_websg_texture_class_id);

  int32_t result = websg_material_set_base_color_texture(material_data->material_id, texture_data->texture_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting texture.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_material_proto_funcs[] = {
  JS_CGETSET_DEF("baseColorTexture", js_websg_material_get_base_color_texture, js_websg_material_set_base_color_texture),
  JS_CGETSET_DEF("metallicFactor", js_websg_material_get_metallic_factor, js_websg_material_set_metallic_factor),
  JS_CGETSET_DEF("roughnessFactor", js_websg_material_get_roughness_factor, js_websg_material_set_roughness_factor),
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

  opaque = JS_NewAtom(ctx, "OPAQUE");
  blend = JS_NewAtom(ctx, "BLEND");
  mask = JS_NewAtom(ctx, "MASK");

  JSValue alpha_mode = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, alpha_mode, "OPAQUE", JS_AtomToValue(ctx, opaque));
  JS_SetPropertyStr(ctx, alpha_mode, "BLEND", JS_AtomToValue(ctx, blend));
  JS_SetPropertyStr(ctx, alpha_mode, "MASK", JS_AtomToValue(ctx, mask));
  JS_SetPropertyStr(ctx, websg, "AlphaMode", alpha_mode);
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
    &websg_material_get_base_color_factor_element,
    &websg_material_set_base_color_factor_element,
    &websg_material_set_base_color_factor
  );

  js_websg_define_rgb_prop(
    ctx,
    material,
    "emissiveFactor",
    material_id,
    &websg_material_get_emissive_factor_element,
    &websg_material_set_emissive_factor_element,
    &websg_material_set_emissive_factor
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

JSValue js_websg_world_create_unlit_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  MaterialProps *props = js_mallocz(ctx, sizeof(MaterialProps));
  props->extensions.count = 1;
  props->extensions.items = js_mallocz(ctx, sizeof(ExtensionItem));
  props->extensions.items[0].name = strdup("KHR_materials_unlit");
  props->extensions.items[0].extension = NULL;

  JSValue name_val = JS_GetPropertyStr(ctx, argv[0], "name");

  if (!JS_IsUndefined(name_val)) {
    props->name = JS_ToCString(ctx, name_val);

    if (props->name == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  }

  MaterialPbrMetallicRoughnessProps *pbr = js_mallocz(ctx, sizeof(MaterialPbrMetallicRoughnessProps));
  props->pbr_metallic_roughness = pbr;

  JSValue base_color_factor_val = JS_GetPropertyStr(ctx, argv[0], "baseColorFactor");

  if (!JS_IsUndefined(base_color_factor_val)) {
    if (js_get_float_array_like(ctx, base_color_factor_val, pbr->base_color_factor, 4) < 0) {
      return JS_EXCEPTION;
    }
  } else {
    pbr->base_color_factor[0] = 1.0f;
    pbr->base_color_factor[1] = 1.0f;
    pbr->base_color_factor[2] = 1.0f;
    pbr->base_color_factor[3] = 1.0f;
  }

  JSValue base_color_texture_val = JS_GetPropertyStr(ctx, argv[0], "baseColorTexture");

  if (!JS_IsUndefined(base_color_texture_val)) {
    WebSGTextureData *base_color_texture_data = JS_GetOpaque2(ctx, base_color_texture_val, js_websg_texture_class_id);

    if (base_color_texture_data == NULL) {
      return JS_EXCEPTION;
    }

    pbr->base_color_texture->texture = base_color_texture_data->texture_id;
  }

  JSValue double_sided_val = JS_GetPropertyStr(ctx, argv[0], "doubleSided");

  if (!JS_IsUndefined(double_sided_val)) {
    int result = JS_ToBool(ctx, double_sided_val);

    if (result < 0) {
      return JS_EXCEPTION;
    }

    props->double_sided = result;
  }

  JSValue alpha_cutoff_val = JS_GetPropertyStr(ctx, argv[0], "alphaCutoff");

  if (!JS_IsUndefined(alpha_cutoff_val)) {
    double alpha_cutoff;

    if (JS_ToFloat64(ctx, &alpha_cutoff, alpha_cutoff_val) < 0) {
      return JS_EXCEPTION;
    }

    props->alpha_cutoff = alpha_cutoff;
  } else {
    props->alpha_cutoff = 0.5f;
  }

  JSValue alpha_mode_val = JS_GetPropertyStr(ctx, argv[0], "alphaMode");

  if (!JS_IsUndefined(alpha_mode_val)) {
    MaterialAlphaMode alpha_mode = get_alpha_mode_from_atom(JS_ValueToAtom(ctx, alpha_mode_val));

    if (alpha_mode == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid alpha mode.");
      return JS_EXCEPTION;
    }

    props->alpha_mode = alpha_mode;
  }

  material_id_t material_id = websg_world_create_material(props);

  if (props->pbr_metallic_roughness != NULL) {
    if (props->pbr_metallic_roughness->base_color_texture != NULL) {
      js_free(ctx, props->pbr_metallic_roughness->base_color_texture);
    }

    js_free(ctx, props->pbr_metallic_roughness);
  }

  js_free(ctx, props);

  if (material_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create material.");
    return JS_EXCEPTION;
  }

  return js_websg_new_material_instance(ctx, world_data, material_id);
}

JSValue js_websg_world_create_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  MaterialProps *props = js_mallocz(ctx, sizeof(MaterialProps));

  JSValue name_val = JS_GetPropertyStr(ctx, argv[0], "name");

  if (!JS_IsUndefined(name_val)) {
    props->name = JS_ToCString(ctx, name_val);

    if (props->name == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  }

  JSValue double_sided_val = JS_GetPropertyStr(ctx, argv[0], "doubleSided");

  if (!JS_IsUndefined(double_sided_val)) {
    int result = JS_ToBool(ctx, double_sided_val);

    if (result < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->double_sided = result;
  }

  JSValue alpha_cutoff_val = JS_GetPropertyStr(ctx, argv[0], "alphaCutoff");

  if (!JS_IsUndefined(alpha_cutoff_val)) {
    double alpha_cutoff;

    if (JS_ToFloat64(ctx, &alpha_cutoff, alpha_cutoff_val) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->alpha_cutoff = alpha_cutoff;
  } else {
    props->alpha_cutoff = 0.5f;
  }

  JSValue alpha_mode_val = JS_GetPropertyStr(ctx, argv[0], "alphaMode");

  if (!JS_IsUndefined(alpha_mode_val)) {
    MaterialAlphaMode alpha_mode = get_alpha_mode_from_atom(JS_ValueToAtom(ctx, alpha_mode_val));

    if (alpha_mode == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid alpha mode.");
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->alpha_mode = alpha_mode;
  }

  MaterialPbrMetallicRoughnessProps *pbr = js_mallocz(ctx, sizeof(MaterialPbrMetallicRoughnessProps));
  props->pbr_metallic_roughness = pbr;

  JSValue base_color_factor_val = JS_GetPropertyStr(ctx, argv[0], "baseColorFactor");

  if (!JS_IsUndefined(base_color_factor_val)) {
    if (js_get_float_array_like(ctx, base_color_factor_val, pbr->base_color_factor, 4) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  } else {
    pbr->base_color_factor[0] = 1.0f;
    pbr->base_color_factor[1] = 1.0f;
    pbr->base_color_factor[2] = 1.0f;
    pbr->base_color_factor[3] = 1.0f;
  }

  JSValue base_color_texture_val = JS_GetPropertyStr(ctx, argv[0], "baseColorTexture");

  if (!JS_IsUndefined(base_color_texture_val)) {
    WebSGTextureData *base_color_texture_data = JS_GetOpaque2(ctx, base_color_texture_val, js_websg_texture_class_id);

    if (base_color_texture_data == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    MaterialTextureInfoProps *base_color_texture = js_mallocz(ctx, sizeof(MaterialTextureInfoProps));
    base_color_texture->texture = base_color_texture_data->texture_id;
    pbr->base_color_texture = base_color_texture;
  }

  JSValue metallic_factor_val = JS_GetPropertyStr(ctx, argv[0], "metallicFactor");

  if (!JS_IsUndefined(metallic_factor_val)) {
    double metallic_factor;

    if (JS_ToFloat64(ctx, &metallic_factor, metallic_factor_val) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    pbr->metallic_factor = metallic_factor;
  } else {
    pbr->metallic_factor = 1.0f;
  }

  JSValue roughness_factor_val = JS_GetPropertyStr(ctx, argv[0], "roughnessFactor");

  if (!JS_IsUndefined(roughness_factor_val)) {
    double roughness_factor;

    if (JS_ToFloat64(ctx, &roughness_factor, roughness_factor_val) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    pbr->roughness_factor = roughness_factor;
  } else {
    pbr->roughness_factor = 1.0f;
  }

  JSValue metallic_roughness_texture_val = JS_GetPropertyStr(ctx, argv[0], "metallicRoughnessTexture");

  if (!JS_IsUndefined(metallic_roughness_texture_val)) {
    WebSGTextureData *metallic_roughness_texture_data = JS_GetOpaque2(ctx, metallic_roughness_texture_val, js_websg_texture_class_id);

    if (metallic_roughness_texture_data == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    MaterialTextureInfoProps *metallic_roughness_texture = js_mallocz(ctx, sizeof(MaterialTextureInfoProps));
    metallic_roughness_texture->texture = metallic_roughness_texture_data->texture_id;
    pbr->metallic_roughness_texture = metallic_roughness_texture;
  }

  JSValue normal_texture_val = JS_GetPropertyStr(ctx, argv[0], "normalTexture");

  if (!JS_IsUndefined(normal_texture_val)) {
    WebSGTextureData *normal_texture_data = JS_GetOpaque2(ctx, normal_texture_val, js_websg_texture_class_id);

    if (normal_texture_data == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    MaterialNormalTextureInfoProps *normal_texture = js_mallocz(ctx, sizeof(MaterialNormalTextureInfoProps));
    normal_texture->texture = normal_texture_data->texture_id;

    JSValue normal_scale_val = JS_GetPropertyStr(ctx, argv[0], "normalScale");

    if (!JS_IsUndefined(normal_scale_val)) {
      double normal_scale;

      if (JS_ToFloat64(ctx, &normal_scale, normal_scale_val) < 0) {
        js_free(ctx, props);
        return JS_EXCEPTION;
      }

      normal_texture->scale = normal_scale;
    } else {
      normal_texture->scale = 1.0f;
    }

    props->normal_texture = normal_texture;
  }

  JSValue occlusion_texture_val = JS_GetPropertyStr(ctx, argv[0], "occlusionTexture");

  if (!JS_IsUndefined(occlusion_texture_val)) {
    WebSGTextureData *occlusion_texture_data = JS_GetOpaque2(ctx, occlusion_texture_val, js_websg_texture_class_id);

    if (occlusion_texture_data == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    MaterialOcclusionTextureInfoProps *occlusion_texture = js_mallocz(ctx, sizeof(MaterialOcclusionTextureInfoProps));
    occlusion_texture->texture = occlusion_texture_data->texture_id;

    JSValue occlusion_strength_val = JS_GetPropertyStr(ctx, argv[0], "occlusionStrength");

    if (!JS_IsUndefined(occlusion_strength_val)) {
      double occlusion_strength;

      if (JS_ToFloat64(ctx, &occlusion_strength, occlusion_strength_val) < 0) {
        js_free(ctx, props);
        return JS_EXCEPTION;
      }

      occlusion_texture->strength = occlusion_strength;
    } else {
      occlusion_texture->strength = 1.0f;
    }

    props->occlusion_texture = occlusion_texture;
  }

  JSValue emissive_factor_val = JS_GetPropertyStr(ctx, argv[0], "emissiveFactor");

  if (!JS_IsUndefined(emissive_factor_val)) {
    if (js_get_float_array_like(ctx, emissive_factor_val, props->emissive_factor, 3) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  } else {
    props->emissive_factor[0] = 0.0f;
    props->emissive_factor[1] = 0.0f;
    props->emissive_factor[2] = 0.0f;
  }

  JSValue emissive_texture_val = JS_GetPropertyStr(ctx, argv[0], "emissiveTexture");

  if (!JS_IsUndefined(emissive_texture_val)) {
    WebSGTextureData *emissive_texture_data = JS_GetOpaque2(ctx, emissive_texture_val, js_websg_texture_class_id);

    if (emissive_texture_data == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    MaterialTextureInfoProps *emissive_texture = js_mallocz(ctx, sizeof(MaterialTextureInfoProps));
    emissive_texture->texture = emissive_texture_data->texture_id;
    props->emissive_texture = emissive_texture;
  }

  material_id_t material_id = websg_world_create_material(props);

  if (props->pbr_metallic_roughness != NULL) {
    if (props->pbr_metallic_roughness->base_color_texture != NULL) {
      js_free(ctx, props->pbr_metallic_roughness->base_color_texture);
    }

    if (props->pbr_metallic_roughness->metallic_roughness_texture != NULL) {
      js_free(ctx, props->pbr_metallic_roughness->metallic_roughness_texture);
    }

    js_free(ctx, props->pbr_metallic_roughness);
  }

  if (props->normal_texture != NULL) {
    js_free(ctx, props->normal_texture);
  }

  if (props->occlusion_texture != NULL) {
    js_free(ctx, props->occlusion_texture);
  }

  if (props->emissive_texture != NULL) {
    js_free(ctx, props->emissive_texture);
  }

  js_free(ctx, props);

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

  material_id_t material_id = websg_world_find_material_by_name(name, length);

  if (material_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_material_by_id(ctx, world_data, material_id);
}