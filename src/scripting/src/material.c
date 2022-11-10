#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "jsutils.h"
#include "websg.h"
#include "material.h"

/**
 * WebSG.Material
 */

typedef struct JSMaterial {
  Material *material;
  JSValue baseColorFactor;
  JSValue emissiveFactor;
  JSValue attenuationColor;
} JSMaterial;

static JSMaterial *create_js_material(JSContext *ctx, Material *material) {
  JSMaterial *jsMaterial = js_malloc(ctx, sizeof(JSMaterial));
  jsMaterial->material = material;
  jsMaterial->baseColorFactor = JS_CreateFloat32Array(ctx, material->base_color_factor, 4);
  jsMaterial->emissiveFactor = JS_CreateFloat32Array(ctx, material->emissive_factor, 3);
  jsMaterial->attenuationColor = JS_CreateFloat32Array(ctx, material->attenuation_color, 3);
  return jsMaterial;
}

static JSClassID js_material_class_id;

static JSValue js_material_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  if (argc < 1 || !JS_IsNumber(argv[0])) {
    JS_ThrowTypeError(ctx, "new Material() expects MaterialType as its first paramater.");
  }

  int32_t materialType;

  if (JS_ToInt32(ctx, &materialType, argv[0])) {
    return JS_EXCEPTION;
  }

  Material *material = websg_create_material((MaterialType)materialType);
  JSValue materialObj = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  // TODO: parse and set args on node

  if (JS_IsException(proto)) {
    websg_dispose_material(material);
    JS_FreeValue(ctx, materialObj);
    return JS_EXCEPTION;
  }
    
  materialObj = JS_NewObjectProtoClass(ctx, proto, js_material_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(materialObj)) {
    websg_dispose_material(material);
    JS_FreeValue(ctx, materialObj);
    return JS_EXCEPTION;
  }

  JSMaterial *jsMaterial = create_js_material(ctx, material);
  JS_SetOpaque(materialObj, jsMaterial);

  return materialObj;
}

static JSValue js_material_get_name(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsMaterial->material->name);
  }
}

static JSValue js_material_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    websg_set_material_name(jsMaterial->material, JS_ToCString(ctx, val));
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_type(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewUint32(ctx, jsMaterial->material->type);
  }
}

static JSValue js_material_get_double_sided(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewBool(ctx, jsMaterial->material->double_sided);
  }
}

static JSValue js_material_set_double_sided(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->double_sided = JS_VALUE_GET_BOOL(val) ? 1 : 0;
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_alpha_cutoff(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->alpha_cutoff);
  }
}

static JSValue js_material_set_alpha_cutoff(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->alpha_cutoff = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_alpha_mode(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewInt32(ctx, jsMaterial->material->alpha_mode);
  }
}

static JSValue js_material_set_alpha_mode(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->alpha_mode = JS_VALUE_GET_INT(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_base_color_factor(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_DupValue(ctx, jsMaterial->baseColorFactor);
  }
}

static JSValue js_material_get_metallic_factor(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->metallic_factor);
  }
}

static JSValue js_material_set_metallic_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->metallic_factor = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_roughness_factor(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->roughness_factor);
  }
}

static JSValue js_material_set_roughness_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->roughness_factor = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_normal_texture_scale(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->normal_texture_scale);
  }
}

static JSValue js_material_set_normal_texture_scale(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->normal_texture_scale = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_occlusion_texture_strength(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->occlusion_texture_strength);
  }
}

static JSValue js_material_set_occlusion_texture_strength(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->occlusion_texture_strength = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_emissive_strength(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->emissive_strength);
  }
}

static JSValue js_material_set_emissive_strength(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->emissive_strength = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_emissive_factor(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_DupValue(ctx, jsMaterial->emissiveFactor);
  }
}

static JSValue js_material_get_ior(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->ior);
  }
}

static JSValue js_material_set_ior(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->ior = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_transmission_factor(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->transmission_factor);
  }
}

static JSValue js_material_set_transmission_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->transmission_factor = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_thickness_factor(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->thickness_factor);
  }
}

static JSValue js_material_set_thickness_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->thickness_factor = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_attenuation_distance(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsMaterial->material->attenuation_distance);
  }
}

static JSValue js_material_set_attenuation_distance(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    jsMaterial->material->attenuation_distance = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_material_get_attenuation_color(JSContext *ctx, JSValueConst this_val) {
  JSMaterial *jsMaterial = JS_GetOpaque2(ctx, this_val, js_material_class_id);

  if (!jsMaterial) {
    return JS_EXCEPTION;
  } else {
    return JS_DupValue(ctx, jsMaterial->attenuationColor);
  }
}

static void js_material_finalizer(JSRuntime *rt, JSValue val) {
  JSMaterial *jsMaterial = JS_GetOpaque(val, js_material_class_id);
  websg_dispose_material(jsMaterial->material);
  js_free_rt(rt, jsMaterial);
}

static JSClassDef js_material_class = {
  "Material",
  .finalizer = js_material_finalizer
};

static const JSCFunctionListEntry js_material_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_material_get_name, js_material_set_name),
  JS_CGETSET_DEF("type", js_material_get_type, NULL),
  JS_CGETSET_DEF("doubleSided", js_material_get_double_sided, js_material_set_double_sided),
  JS_CGETSET_DEF("alphaCutoff", js_material_get_alpha_cutoff, js_material_set_alpha_cutoff),
  JS_CGETSET_DEF("alphaMode", js_material_get_alpha_mode, js_material_set_alpha_mode),
  JS_CGETSET_DEF("baseColorFactor", js_material_get_base_color_factor, NULL),
  JS_CGETSET_DEF("metallicFactor", js_material_get_metallic_factor, js_material_set_metallic_factor),
  JS_CGETSET_DEF("roughnessFactor", js_material_get_roughness_factor, js_material_set_roughness_factor),
  JS_CGETSET_DEF("normalTextureScale", js_material_get_normal_texture_scale, js_material_set_normal_texture_scale),
  JS_CGETSET_DEF(
    "occlusionTextureStrength",
    js_material_get_occlusion_texture_strength,
    js_material_set_occlusion_texture_strength
  ),
  JS_CGETSET_DEF("emissiveStrength", js_material_get_emissive_strength, js_material_set_emissive_strength),
  JS_CGETSET_DEF("emissiveFactor", js_material_get_emissive_factor, NULL),
  JS_CGETSET_DEF("ior", js_material_get_ior, js_material_set_ior),
  JS_CGETSET_DEF("transmissionFactor", js_material_get_transmission_factor, js_material_set_transmission_factor),
  JS_CGETSET_DEF("thicknessFactor", js_material_get_thickness_factor, js_material_set_thickness_factor),
  JS_CGETSET_DEF("attenuationDistance", js_material_get_attenuation_distance, js_material_set_attenuation_distance),
  JS_CGETSET_DEF("attenuationColor", js_material_get_attenuation_color, NULL),
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
 * WebSG material related functions
*/

static JSValue js_get_material_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv){
  const char *name = JS_ToCString(ctx, argv[0]);
  Material *material = websg_get_material_by_name(name);
  JS_FreeCString(ctx, name);

  if (!material) {
    return JS_UNDEFINED;
  } else {
    JSValue materialObj = JS_NewObjectClass(ctx, js_material_class_id);
    JSMaterial *jsMaterial = create_js_material(ctx, material);
    JS_SetOpaque(materialObj, jsMaterial);
    return materialObj;
  }
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