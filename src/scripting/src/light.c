#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "jsutils.h"
#include "websg.h"
#include "light.h"

/**
 * WebSG.Light
 */

typedef struct JSLight {
  Light *light;
  JSValue color;
} JSLight;

static JSLight *create_js_light(JSContext *ctx, Light *light) {
  JSLight *jsLight = js_malloc(ctx, sizeof(JSLight));
  jsLight->light = light;
  jsLight->color = JS_CreateFloat32Array(ctx, light->color, 3);
  return jsLight;
}

static JSClassID js_light_class_id;

static JSValue js_light_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Light *light = websg_create_light();
  JSValue lightObj = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  // TODO: parse and set args on node

  if (JS_IsException(proto)) {
    websg_dispose_light(light);
    JS_FreeValue(ctx, lightObj);
    return JS_EXCEPTION;
  }
    
  lightObj = JS_NewObjectProtoClass(ctx, proto, js_light_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(lightObj)) {
    websg_dispose_light(light);
    JS_FreeValue(ctx, lightObj);
    return JS_EXCEPTION;
  }

  JSLight *jsLight = create_js_light(ctx, light);
  JS_SetOpaque(lightObj, jsLight);

  return lightObj;
}

static JSValue js_light_get_name(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsLight->light->name);
  }
}

static JSValue js_light_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    websg_set_light_name(jsLight->light, JS_ToCString(ctx, val));
    return JS_UNDEFINED;
  }
}

static JSValue js_light_get_type(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewUint32(ctx, jsLight->light->type);
  }
}

static JSValue js_light_get_color(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_DupValue(ctx, jsLight->color);
  }
}

static JSValue js_light_get_intensity(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsLight->light->intensity);
  }
}

static JSValue js_light_set_intensity(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    jsLight->light->intensity = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_light_get_range(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsLight->light->range);
  }
}

static JSValue js_light_set_range(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    jsLight->light->range = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_light_get_cast_shadow(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewBool(ctx, jsLight->light->cast_shadow);
  }
}

static JSValue js_light_set_cast_shadow(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    jsLight->light->cast_shadow = JS_VALUE_GET_BOOL(val) ? 1 : 0;
    return JS_UNDEFINED;
  }
}

static JSValue js_light_get_inner_cone_angle(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsLight->light->inner_cone_angle);
  }
}

static JSValue js_light_set_inner_cone_angle(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    jsLight->light->inner_cone_angle = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static JSValue js_light_get_outer_cone_angle(JSContext *ctx, JSValueConst this_val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    return JS_NewFloat64(ctx, jsLight->light->outer_cone_angle);
  }
}

static JSValue js_light_set_outer_cone_angle(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSLight *jsLight = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!jsLight) {
    return JS_EXCEPTION;
  } else {
    jsLight->light->outer_cone_angle = JS_VALUE_GET_FLOAT64(val);
    return JS_UNDEFINED;
  }
}

static void js_light_finalizer(JSRuntime *rt, JSValue val) {
  JSLight *jsLight = JS_GetOpaque(val, js_light_class_id);
  websg_dispose_light(jsLight->light);
  js_free_rt(rt, jsLight);
}

static JSClassDef js_light_class = {
  "Light",
  .finalizer = js_light_finalizer
};

static const JSCFunctionListEntry js_light_proto_funcs[] = {
  JS_CGETSET_DEF("type", js_light_get_type, NULL),
  JS_CGETSET_DEF("color", js_light_get_color, NULL),
  JS_CGETSET_DEF("intensity", js_light_get_intensity, js_light_set_intensity),
  JS_CGETSET_DEF("range", js_light_get_range, js_light_set_range),
  JS_CGETSET_DEF("castShadow", js_light_get_cast_shadow, js_light_set_cast_shadow),
  JS_CGETSET_DEF("innerConeAngle", js_light_get_inner_cone_angle, js_light_set_inner_cone_angle),
  JS_CGETSET_DEF("outerConeAngle", js_light_get_outer_cone_angle, js_light_set_outer_cone_angle),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Light", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_light_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_light_class_id);
  JS_NewClass(rt, js_light_class_id, &js_light_class);

  JSValue light_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, light_proto, js_light_proto_funcs, countof(js_light_proto_funcs));
  
  JSValue light_class = JS_NewCFunction2(ctx, js_light_constructor, "Light", 1, JS_CFUNC_constructor, 0);
  JS_SetConstructor(ctx, light_class, light_proto);
  JS_SetClassProto(ctx, js_light_class_id, light_proto);

  return light_class;
}

/**
 * WebSG light related functions
*/

static JSValue js_get_light_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv){
  const char *name = JS_ToCString(ctx, argv[0]);
  Light *light = websg_get_light_by_name(name);
  JS_FreeCString(ctx, name);

  if (!light) {
    return JS_UNDEFINED;
  } else {
    JSValue lightObj = JS_NewObjectClass(ctx, js_light_class_id);
    JSLight *jsLight = create_js_light(ctx, light);
    JS_SetOpaque(lightObj, jsLight);
    return lightObj;
  }
}

void js_define_light_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Light", js_define_light_class(ctx));
  JS_SetPropertyStr(ctx, *target, "getLightByName", JS_NewCFunction(ctx, js_get_light_by_name, "getLightByName", 1));
}