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
#include "light.h"

/**
 * WebSG.Light
 */

JSClassID js_light_class_id;

static JSValue js_light_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Light *light = js_mallocz(ctx, sizeof(Light));

  

  if (websg_create_resource(ResourceType_Light, light)) {
    return JS_EXCEPTION;
  }

  return create_light_from_ptr(ctx, light);
}


static JSValue js_light_get_name(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, light->name);
    return val;
  }
}


static JSValue js_light_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    light->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_light_get_type(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, light->type);
    return val;
  }
}


static JSValue js_light_get_intensity(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)light->intensity);
    return val;
  }
}


static JSValue js_light_set_intensity(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &light->intensity, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_light_get_range(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)light->range);
    return val;
  }
}


static JSValue js_light_set_range(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &light->range, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_light_get_cast_shadow(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, light->cast_shadow);
    return val;
  }
}


static JSValue js_light_set_cast_shadow(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    light->cast_shadow = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_light_get_inner_cone_angle(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)light->inner_cone_angle);
    return val;
  }
}


static JSValue js_light_set_inner_cone_angle(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &light->inner_cone_angle, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_light_get_outer_cone_angle(JSContext *ctx, JSValueConst this_val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)light->outer_cone_angle);
    return val;
  }
}


static JSValue js_light_set_outer_cone_angle(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Light *light = JS_GetOpaque2(ctx, this_val, js_light_class_id);

  if (!light) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &light->outer_cone_angle, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}




static JSValue js_light_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Light *light = JS_GetOpaque(this_val, js_light_class_id);
  websg_dispose_resource(light);
  js_free(ctx, light);
  return JS_UNDEFINED;
}

static JSClassDef js_light_class = {
  "Light"
};

static const JSCFunctionListEntry js_light_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_light_get_name, js_light_set_name),
  JS_CGETSET_DEF("type", js_light_get_type, NULL),
  JS_CGETSET_DEF("intensity", js_light_get_intensity, js_light_set_intensity),
  JS_CGETSET_DEF("range", js_light_get_range, js_light_set_range),
  JS_CGETSET_DEF("castShadow", js_light_get_cast_shadow, js_light_set_cast_shadow),
  JS_CGETSET_DEF("innerConeAngle", js_light_get_inner_cone_angle, js_light_set_inner_cone_angle),
  JS_CGETSET_DEF("outerConeAngle", js_light_get_outer_cone_angle, js_light_set_outer_cone_angle),
  JS_CFUNC_DEF("dispose", 0, js_light_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Light", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_light_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_light_class_id);
  JS_NewClass(rt, js_light_class_id, &js_light_class);

  JSValue light_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, light_proto, js_light_proto_funcs, countof(js_light_proto_funcs));
  
  JSValue light_class = JS_NewCFunction2(ctx, js_light_constructor, "Light", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, light_class, light_proto);
  JS_SetClassProto(ctx, js_light_class_id, light_proto);

  return light_class;
}

/**
 * WebSG.Light related functions
*/

static JSValue js_get_light_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Light *light = websg_get_resource_by_name(ResourceType_Light, name);
  JS_FreeCString(ctx, name);
  return create_light_from_ptr(ctx, light);
}

JSValue create_light_from_ptr(JSContext *ctx, Light *light) {
  if (!light) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, light);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_light_class_id);
    JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "color", light->color, 3);
    JS_SetOpaque(val, light);
    set_js_val_from_ptr(ctx, light, val);
  }

  return val;
}

void js_define_light_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Light", js_define_light_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getLightByName",
    JS_NewCFunction(ctx, js_get_light_by_name, "getLightByName", 1)
  );
}