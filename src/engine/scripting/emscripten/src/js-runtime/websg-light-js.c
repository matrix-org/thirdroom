#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-js.h"
#include "./websg-light-js.h"

static JSClassDef websg_light_class = {
  "WebSGLight"
};

static const JSCFunctionListEntry websg_light_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGLight", JS_PROP_CONFIGURABLE),
};

void js_define_websg_light(JSContext *ctx) {
  JS_NewClassID(&websg_light_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_light_class_id, &websg_light_class);
  JSValue light_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, light_proto, websg_light_proto_funcs, countof(websg_light_proto_funcs));
  JS_SetClassProto(ctx, websg_light_class_id, light_proto);
}

JSValue js_websg_find_light_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  light_id_t light_id = websg_light_find_by_name(name, length);

  if (light_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_light_by_id(ctx, light_id);
}

JSValue js_websg_new_light_instance(JSContext *ctx, WebSGContext *websg, light_id_t light_id) {
  JSValue light = JS_NewObjectClass(ctx, websg_light_class_id);

  if (JS_IsException(light)) {
    return light;
  }

  js_set_opaque_id(light, light_id);

  JS_SetPropertyUint32(ctx, websg->lights, light_id, JS_DupValue(ctx, light));
  
  return light;
}

JSValue js_websg_create_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  LightType light_type = get_light_type_from_atom(JS_ValueToAtom(ctx, argv[0]));

  if (light_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown light type.");
    return JS_EXCEPTION;
  }

  light_id_t light_id = websg_create_light(light_type);

  if (light_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create light.");
    return JS_EXCEPTION;
  }

  return js_websg_new_light_instance(ctx, websg, light_id);
}

JSValue js_websg_get_light_by_id(JSContext *ctx, light_id_t light_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue light = JS_GetPropertyUint32(ctx, websg->lights, light_id);

  if (!JS_IsUndefined(light)) {
    return JS_DupValue(ctx, light);
  }

  return js_websg_new_light_instance(ctx, websg, light_id);
}
