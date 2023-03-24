#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-js.h"
#include "./websg-collider-js.h"

static JSClassDef websg_collider_class = {
  "WebSGCollider"
};

static const JSCFunctionListEntry websg_collider_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGCollider", JS_PROP_CONFIGURABLE),
};

void js_define_websg_collider(JSContext *ctx) {
  JS_NewClassID(&websg_collider_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_collider_class_id, &websg_collider_class);
  JSValue collider_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, collider_proto, websg_collider_proto_funcs, countof(websg_collider_proto_funcs));
  JS_SetClassProto(ctx, websg_collider_class_id, collider_proto);
}

JSValue js_websg_find_collider_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  collider_id_t collider_id = websg_collider_find_by_name(name, length);

  if (collider_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_collider_by_id(ctx, collider_id);
}

JSValue js_websg_new_collider_instance(JSContext *ctx, WebSGContext *websg, collider_id_t collider_id) {
  JSValue collider = JS_NewObjectClass(ctx, websg_collider_class_id);

  if (JS_IsException(collider)) {
    return collider;
  }

  js_set_opaque_id(collider, collider_id);

  JS_SetPropertyUint32(ctx, websg->colliders, collider_id, JS_DupValue(ctx, collider));
  
  return collider;
}

static JSValue js_create_collider(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  ColliderProps *props = js_mallocz(ctx, sizeof(ColliderProps));

  JSValue typeVal = JS_GetPropertyStr(ctx, argv[0], "type");

  ColliderType collider_type =  get_collider_type_from_atom(JS_ValueToAtom(ctx, typeVal));

  if (collider_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown collider type.");
    return JS_EXCEPTION;
  }

  JSValue isTriggerVal = JS_GetPropertyStr(ctx, argv[0], "isTrigger");

  if (!JS_IsUndefined(isTriggerVal)) {
    int is_trigger = JS_ToBool(ctx, isTriggerVal);

    if (is_trigger < 0) {
      return JS_EXCEPTION;
    }

    props->is_trigger = is_trigger;
  }

  JSValue size_val = JS_GetPropertyStr(ctx, argv[0], "size");

  if (!JS_IsUndefined(size_val)) {
    float_t *size = get_typed_array_data(ctx, &size_val, sizeof(float_t) * 3);

    if (size == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->size, size, sizeof(float_t) * 3);
  }

  JSValue radius_val = JS_GetPropertyStr(ctx, argv[0], "radius");

  if (!JS_IsUndefined(radius_val)) {
    double_t radius;

    if (JS_ToFloat64(ctx, &radius, radius_val) == -1) {
      return JS_EXCEPTION;
    }

    props->radius = (float_t)radius;
  }

  JSValue height_val = JS_GetPropertyStr(ctx, argv[0], "height");

  if (!JS_IsUndefined(height_val)) {
    double_t height;

    if (JS_ToFloat64(ctx, &height, height_val) == -1) {
      return JS_EXCEPTION;
    }

    props->height = (float_t)height;
  }

  JSValue mesh_val = JS_GetPropertyStr(ctx, argv[0], "mesh");

  if (!JS_IsUndefined(mesh_val)) {
    mesh_id_t mesh_id;

    if (JS_ToUint32(ctx, &mesh_id, mesh_val) == -1) {
      return JS_EXCEPTION;
    }

    props->mesh = mesh_id;
  }

  collider_id_t collider_id = websg_create_collider(props);

  if (collider_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create collider.");
    return JS_EXCEPTION;
  }

  return js_websg_new_collider_instance(ctx, websg, collider_id);
}

JSValue js_websg_get_collider_by_id(JSContext *ctx, collider_id_t collider_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue collider = JS_GetPropertyUint32(ctx, websg->colliders, collider_id);

  if (!JS_IsUndefined(collider)) {
    return JS_DupValue(ctx, collider);
  }

  return js_websg_new_collider_instance(ctx, websg, collider_id);
}
