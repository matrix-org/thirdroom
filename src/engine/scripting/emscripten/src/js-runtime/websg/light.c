#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./light.h"
#include "./rgb.h"
#include "../utils/array.h"

JSClassID js_websg_light_class_id;

/**
 * Private Methods and Variables
 **/

JSAtom directional;
JSAtom point;
JSAtom spot;

LightType get_light_type_from_atom(JSAtom atom) {
  if (atom == directional) {
    return LightType_Directional;
  } else if (atom == point) {
    return LightType_Point;
  } else if (atom == spot) {
    return LightType_Spot;
  } else {
    return -1;
  }
}

/**
 * Class Definition
 **/

static void js_websg_light_finalizer(JSRuntime *rt, JSValue val) {
  WebSGLightData *light_data = JS_GetOpaque(val, js_websg_light_class_id);

  if (light_data) {
    js_free_rt(rt, light_data);
  }
}

static JSClassDef js_websg_light_class = {
  "Light",
  .finalizer = js_websg_light_finalizer
};

static JSValue js_websg_light_get_intensity(JSContext *ctx, JSValueConst this_val) {
 WebSGLightData *light_data = JS_GetOpaque(this_val, js_websg_light_class_id);

  float_t result = websg_light_get_intensity(light_data->light_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_light_set_intensity(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGLightData *light_data = JS_GetOpaque(this_val, js_websg_light_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_light_set_intensity(light_data->light_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting intensity.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_light_proto_funcs[] = {
  JS_CGETSET_DEF("intensity", js_websg_light_get_intensity, js_websg_light_set_intensity),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Light", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_light_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_light(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_light_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_light_class_id, &js_websg_light_class);
  JSValue light_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, light_proto, js_websg_light_proto_funcs, countof(js_websg_light_proto_funcs));
  JS_SetClassProto(ctx, js_websg_light_class_id, light_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_light_constructor,
    "Light",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, light_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Light",
    constructor
  );

  directional = JS_NewAtom(ctx, "directional");
  point = JS_NewAtom(ctx, "point");
  spot = JS_NewAtom(ctx, "spot");

  JSValue light_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, light_type, "Directional", JS_AtomToValue(ctx, directional));
  JS_SetPropertyStr(ctx, light_type, "Point", JS_AtomToValue(ctx, point));
  JS_SetPropertyStr(ctx, light_type, "Spot", JS_AtomToValue(ctx, spot));
  JS_SetPropertyStr(ctx, websg, "LightType", light_type);
}

JSValue js_websg_new_light_instance(JSContext *ctx, WebSGWorldData *world_data, light_id_t light_id) {
  JSValue light = JS_NewObjectClass(ctx, js_websg_light_class_id);

  if (JS_IsException(light)) {
    return light;
  }

   js_websg_define_rgb_prop(
    ctx,
    light,
    "color",
    light_id,
    &websg_light_get_color_element,
    &websg_light_set_color_element,
    &websg_light_set_color
  );

  WebSGLightData *light_data = js_mallocz(ctx, sizeof(WebSGLightData));
  light_data->world_data = world_data;
  light_data->light_id = light_id;
  JS_SetOpaque(light, light_data);

  JS_SetPropertyUint32(ctx, world_data->lights, light_id, JS_DupValue(ctx, light));
  
  return light;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_light_by_id(JSContext *ctx, WebSGWorldData *world_data, light_id_t light_id) {
  JSValue light = JS_GetPropertyUint32(ctx, world_data->lights, light_id);

  if (!JS_IsUndefined(light)) {
    return JS_DupValue(ctx, light);
  }

  return js_websg_new_light_instance(ctx, world_data, light_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  LightProps *props = js_mallocz(ctx, sizeof(LightProps));
  props->color[0] = 1.0f;
  props->color[1] = 1.0f;
  props->color[2] = 1.0f;
  props->intensity = 1.0f;
  props->range = 1.0f;

  props->type = get_light_type_from_atom(JS_ValueToAtom(ctx, argv[0]));

  if (props->type == -1) {
    js_free(ctx, props);
    JS_ThrowTypeError(ctx, "WebSG: Unknown light type.");
    return JS_EXCEPTION;
  }

  JSValue name_val = JS_GetPropertyStr(ctx, argv[0], "name");

  if (!JS_IsUndefined(name_val)) {
    props->name = JS_ToCString(ctx, name_val);

    if (props->name == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  }

  JSValue color_val = JS_GetPropertyStr(ctx, argv[0], "color");

  if (!JS_IsUndefined(color_val)) {
    if (js_get_float_array_like(ctx, color_val, props->color, 3) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }
  }

  JSValue intensity_val = JS_GetPropertyStr(ctx, argv[0], "intensity");

  if (!JS_IsUndefined(intensity_val)) {
    double intensity;
    
    if (JS_ToFloat64(ctx, &intensity, intensity_val) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->intensity = (float_t)intensity;
  }

  JSValue range_val = JS_GetPropertyStr(ctx, argv[0], "range");

  if (!JS_IsUndefined(range_val)) {
    double range;
    
    if (JS_ToFloat64(ctx, &range, range_val) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->range = (float_t)range;
  }

  if (props->type == LightType_Spot) {
    JSValue inner_cone_angle_val = JS_GetPropertyStr(ctx, argv[0], "innerConeAngle");

    if (!JS_IsUndefined(inner_cone_angle_val)) {
      double inner_cone_angle;
      
      if (JS_ToFloat64(ctx, &inner_cone_angle, inner_cone_angle_val) < 0) {
        js_free(ctx, props);
        return JS_EXCEPTION;
      }

      props->spot.inner_cone_angle = (float_t)inner_cone_angle;
    }

    JSValue outer_cone_angle_val = JS_GetPropertyStr(ctx, argv[0], "outerConeAngle");

    if (!JS_IsUndefined(outer_cone_angle_val)) {
      double outer_cone_angle;
      
      if (JS_ToFloat64(ctx, &outer_cone_angle, outer_cone_angle_val) < 0) {
        js_free(ctx, props);
        return JS_EXCEPTION;
      }

      props->spot.outer_cone_angle = (float_t)outer_cone_angle;
    }
  }

  light_id_t light_id = websg_world_create_light(props);

  js_free(ctx, props);

  if (light_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create light.");
    return JS_EXCEPTION;
  }

  return js_websg_new_light_instance(ctx, world_data, light_id);
}


JSValue js_websg_world_find_light_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  light_id_t light_id = websg_world_find_light_by_name(name, length);

  if (light_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_light_by_id(ctx, world_data, light_id);
}
