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
#include "light-map.h"
#include "texture.h"

/**
 * WebSG.LightMap
 */

JSClassID js_light_map_class_id;

static JSValue js_light_map_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  LightMap *light_map = js_mallocz(ctx, sizeof(LightMap));

  

  if (websg_create_resource(ResourceType_LightMap, light_map)) {
    return JS_EXCEPTION;
  }

  return create_light_map_from_ptr(ctx, light_map);
}


static JSValue js_light_map_get_name(JSContext *ctx, JSValueConst this_val) {
  LightMap *light_map = JS_GetOpaque2(ctx, this_val, js_light_map_class_id);

  if (!light_map) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, light_map->name);
    return val;
  }
}


static JSValue js_light_map_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  LightMap *light_map = JS_GetOpaque2(ctx, this_val, js_light_map_class_id);

  if (!light_map) {
    return JS_EXCEPTION;
  } else {
    light_map->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_light_map_get_texture(JSContext *ctx, JSValueConst this_val) {
  LightMap *light_map = JS_GetOpaque2(ctx, this_val, js_light_map_class_id);

  if (!light_map) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, light_map->texture);
    return val;
  }
}


static JSValue js_light_map_get_intensity(JSContext *ctx, JSValueConst this_val) {
  LightMap *light_map = JS_GetOpaque2(ctx, this_val, js_light_map_class_id);

  if (!light_map) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)light_map->intensity);
    return val;
  }
}




static JSValue js_light_map_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  LightMap *light_map = JS_GetOpaque(this_val, js_light_map_class_id);
  websg_dispose_resource(light_map);
  js_free(ctx, light_map);
  return JS_UNDEFINED;
}

static JSClassDef js_light_map_class = {
  "LightMap"
};

static const JSCFunctionListEntry js_light_map_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_light_map_get_name, js_light_map_set_name),
  JS_CGETSET_DEF("texture", js_light_map_get_texture, NULL),
  JS_CGETSET_DEF("intensity", js_light_map_get_intensity, NULL),
  JS_CFUNC_DEF("dispose", 0, js_light_map_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "LightMap", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_light_map_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_light_map_class_id);
  JS_NewClass(rt, js_light_map_class_id, &js_light_map_class);

  JSValue light_map_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, light_map_proto, js_light_map_proto_funcs, countof(js_light_map_proto_funcs));
  
  JSValue light_map_class = JS_NewCFunction2(ctx, js_light_map_constructor, "LightMap", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, light_map_class, light_map_proto);
  JS_SetClassProto(ctx, js_light_map_class_id, light_map_proto);

  return light_map_class;
}

/**
 * WebSG.LightMap related functions
*/

static JSValue js_get_light_map_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  LightMap *light_map = websg_get_resource_by_name(ResourceType_LightMap, name);
  JS_FreeCString(ctx, name);
  return create_light_map_from_ptr(ctx, light_map);
}

JSValue create_light_map_from_ptr(JSContext *ctx, LightMap *light_map) {
  if (!light_map) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, light_map);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_light_map_class_id);
    JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "offset", light_map->offset, 2);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "scale", light_map->scale, 2);
    JS_SetOpaque(val, light_map);
    set_js_val_from_ptr(ctx, light_map, val);
  }

  return val;
}

void js_define_light_map_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "LightMap", js_define_light_map_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getLightMapByName",
    JS_NewCFunction(ctx, js_get_light_map_by_name, "getLightMapByName", 1)
  );
}