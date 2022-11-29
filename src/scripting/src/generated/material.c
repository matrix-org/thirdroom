#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../../include/quickjs/cutils.h"
#include "../../include/quickjs/quickjs.h"

#include "../jsutils.h"
#include "../websg-utils.h"
#include "../script-context.h"
#include "websg.h"
#include "material.h"
#include "texture.h"

/**
 * WebSG.Material
 */

JSClassID js_material_class_id;

static JSValue js_material_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Material *material = js_mallocz(ctx, sizeof(Material));

  

  if (websg_create_resource(ResourceType_Material, material)) {
    return JS_EXCEPTION;
  }

  return create_material_from_ptr(ctx, material);
}


static JSValue js_material_get_name(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, material->name);
    return val;
  }
}


static JSValue js_material_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_type(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, material->type);
    return val;
  }
}


static JSValue js_material_set_type(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &material->type, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_double_sided(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, material->double_sided);
    return val;
  }
}


static JSValue js_material_set_double_sided(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->double_sided = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_alpha_cutoff(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->alpha_cutoff);
    return val;
  }
}


static JSValue js_material_set_alpha_cutoff(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->alpha_cutoff, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_alpha_mode(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, material->alpha_mode);
    return val;
  }
}


static JSValue js_material_set_alpha_mode(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &material->alpha_mode, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_base_color_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->base_color_texture);
    return val;
  }
}


static JSValue js_material_set_base_color_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->base_color_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_metallic_factor(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->metallic_factor);
    return val;
  }
}


static JSValue js_material_set_metallic_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->metallic_factor, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_roughness_factor(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->roughness_factor);
    return val;
  }
}


static JSValue js_material_set_roughness_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->roughness_factor, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_metallic_roughness_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->metallic_roughness_texture);
    return val;
  }
}


static JSValue js_material_set_metallic_roughness_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->metallic_roughness_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_normal_texture_scale(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->normal_texture_scale);
    return val;
  }
}


static JSValue js_material_set_normal_texture_scale(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->normal_texture_scale, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_normal_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->normal_texture);
    return val;
  }
}


static JSValue js_material_set_normal_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->normal_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_occlusion_texture_strength(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->occlusion_texture_strength);
    return val;
  }
}


static JSValue js_material_set_occlusion_texture_strength(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->occlusion_texture_strength, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_occlusion_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->occlusion_texture);
    return val;
  }
}


static JSValue js_material_set_occlusion_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->occlusion_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_emissive_strength(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->emissive_strength);
    return val;
  }
}


static JSValue js_material_set_emissive_strength(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->emissive_strength, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_emissive_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->emissive_texture);
    return val;
  }
}


static JSValue js_material_set_emissive_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->emissive_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_ior(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->ior);
    return val;
  }
}


static JSValue js_material_set_ior(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->ior, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_transmission_factor(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->transmission_factor);
    return val;
  }
}


static JSValue js_material_set_transmission_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->transmission_factor, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_transmission_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->transmission_texture);
    return val;
  }
}


static JSValue js_material_set_transmission_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->transmission_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_thickness_factor(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->thickness_factor);
    return val;
  }
}


static JSValue js_material_set_thickness_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->thickness_factor, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_thickness_texture(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, material->thickness_texture);
    return val;
  }
}


static JSValue js_material_set_thickness_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    material->thickness_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_material_get_attenuation_distance(JSContext *ctx, JSValueConst this_val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)material->attenuation_distance);
    return val;
  }
}


static JSValue js_material_set_attenuation_distance(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Material *material = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!material) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &material->attenuation_distance, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}




static JSValue js_material_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Material *material = JS_GetOpaque(this_val, js_material_class_id);
  websg_dispose_resource(material);
  js_free(ctx, material);
  return JS_UNDEFINED;
}

static JSClassDef js_material_class = {
  "Material"
};

static const JSCFunctionListEntry js_material_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_material_get_name, js_material_set_name),
  JS_CGETSET_DEF("type", js_material_get_type, js_material_set_type),
  JS_CGETSET_DEF("doubleSided", js_material_get_double_sided, js_material_set_double_sided),
  JS_CGETSET_DEF("alphaCutoff", js_material_get_alpha_cutoff, js_material_set_alpha_cutoff),
  JS_CGETSET_DEF("alphaMode", js_material_get_alpha_mode, js_material_set_alpha_mode),
  JS_CGETSET_DEF("baseColorTexture", js_material_get_base_color_texture, js_material_set_base_color_texture),
  JS_CGETSET_DEF("metallicFactor", js_material_get_metallic_factor, js_material_set_metallic_factor),
  JS_CGETSET_DEF("roughnessFactor", js_material_get_roughness_factor, js_material_set_roughness_factor),
  JS_CGETSET_DEF("metallicRoughnessTexture", js_material_get_metallic_roughness_texture, js_material_set_metallic_roughness_texture),
  JS_CGETSET_DEF("normalTextureScale", js_material_get_normal_texture_scale, js_material_set_normal_texture_scale),
  JS_CGETSET_DEF("normalTexture", js_material_get_normal_texture, js_material_set_normal_texture),
  JS_CGETSET_DEF("occlusionTextureStrength", js_material_get_occlusion_texture_strength, js_material_set_occlusion_texture_strength),
  JS_CGETSET_DEF("occlusionTexture", js_material_get_occlusion_texture, js_material_set_occlusion_texture),
  JS_CGETSET_DEF("emissiveStrength", js_material_get_emissive_strength, js_material_set_emissive_strength),
  JS_CGETSET_DEF("emissiveTexture", js_material_get_emissive_texture, js_material_set_emissive_texture),
  JS_CGETSET_DEF("ior", js_material_get_ior, js_material_set_ior),
  JS_CGETSET_DEF("transmissionFactor", js_material_get_transmission_factor, js_material_set_transmission_factor),
  JS_CGETSET_DEF("transmissionTexture", js_material_get_transmission_texture, js_material_set_transmission_texture),
  JS_CGETSET_DEF("thicknessFactor", js_material_get_thickness_factor, js_material_set_thickness_factor),
  JS_CGETSET_DEF("thicknessTexture", js_material_get_thickness_texture, js_material_set_thickness_texture),
  JS_CGETSET_DEF("attenuationDistance", js_material_get_attenuation_distance, js_material_set_attenuation_distance),
  JS_CFUNC_DEF("dispose", 0, js_material_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Material", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_material_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_material_class_id);
  JS_NewClass(rt, js_material_class_id, &js_material_class);

  JSValue material_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, material_proto, js_material_proto_funcs, countof(js_material_proto_funcs));
  
  JSValue material_class = JS_NewCFunction2(ctx, js_material_constructor, "Material", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, material_class, material_proto);
  JS_SetClassProto(ctx, js_material_class_id, material_proto);

  return material_class;
}

/**
 * WebSG.Material related functions
*/

static JSValue js_get_material_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Material *material = websg_get_resource_by_name(ResourceType_Material, name);
  JS_FreeCString(ctx, name);
  return create_material_from_ptr(ctx, material);
}

JSValue create_material_from_ptr(JSContext *ctx, Material *material) {
  if (!material) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, material);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_material_class_id);
    JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "baseColorFactor", material->base_color_factor, 4);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "emissiveFactor", material->emissive_factor, 3);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "attenuationColor", material->attenuation_color, 3);
    JS_SetOpaque(val, material);
    set_js_val_from_ptr(ctx, material, val);
  }

  return val;
}

void js_define_material_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Material", js_define_material_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getMaterialByName",
    JS_NewCFunction(ctx, js_get_material_by_name, "getMaterialByName", 1)
  );
}