#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./collider.h"
#include "./mesh.h"
#include "../utils/array.h"

JSClassID js_websg_collider_class_id;

/**
 * Private Methods and Variables
 **/

JSAtom collider_type_box;
JSAtom collider_type_sphere;
JSAtom collider_type_capsule;
JSAtom collider_type_cylinder;
JSAtom collider_type_hull;
JSAtom collider_type_trimesh;

ColliderType get_collider_type_from_atom(JSAtom atom) {
  if (atom == collider_type_box) {
    return ColliderType_Box;
  } else if (atom == collider_type_sphere) {
    return ColliderType_Sphere;
  } else if (atom == collider_type_capsule) {
    return ColliderType_Capsule;
  } else if (atom == collider_type_cylinder) {
    return ColliderType_Cylinder;
  } else if (atom == collider_type_hull) {
    return ColliderType_Hull;
  } else if (atom == collider_type_trimesh) {
    return ColliderType_Trimesh;
  } else {
    return -1;
  }
}

/**
 * Class Definition
 **/

static void js_websg_collider_finalizer(JSRuntime *rt, JSValue val) {
  WebSGColliderData *collider_data = JS_GetOpaque(val, js_websg_collider_class_id);

  if (collider_data) {
    js_free_rt(rt, collider_data);
  }
}

static JSClassDef js_websg_collider_class = {
  "Collider",
  .finalizer = js_websg_collider_finalizer
};

static const JSCFunctionListEntry js_websg_collider_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Collider", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_collider_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_collider(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_collider_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_collider_class_id, &js_websg_collider_class);
  JSValue collider_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    collider_proto,
    js_websg_collider_proto_funcs,
    countof(js_websg_collider_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_collider_class_id, collider_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_collider_constructor,
    "Collider",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, collider_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Collider",
    constructor
  );

  collider_type_box = JS_NewAtom(ctx, "box");
  collider_type_sphere = JS_NewAtom(ctx, "sphere");
  collider_type_capsule = JS_NewAtom(ctx, "capsule");
  collider_type_cylinder = JS_NewAtom(ctx, "cylinder");
  collider_type_hull = JS_NewAtom(ctx, "hull");
  collider_type_trimesh = JS_NewAtom(ctx, "trimesh");

  JSValue collider_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, collider_type, "Box", JS_AtomToValue(ctx, collider_type_box));
  JS_SetPropertyStr(ctx, collider_type, "Sphere", JS_AtomToValue(ctx, collider_type_sphere));
  JS_SetPropertyStr(ctx, collider_type, "Capsule", JS_AtomToValue(ctx, collider_type_capsule));
  JS_SetPropertyStr(ctx, collider_type, "Cylinder", JS_AtomToValue(ctx, collider_type_cylinder));
  JS_SetPropertyStr(ctx, collider_type, "Hull", JS_AtomToValue(ctx, collider_type_hull));
  JS_SetPropertyStr(ctx, collider_type, "Trimesh", JS_AtomToValue(ctx, collider_type_trimesh));
  JS_SetPropertyStr(ctx, websg, "ColliderType", collider_type);
}

/**
 * Public Methods
 **/

JSValue js_websg_new_collider_instance(JSContext *ctx, WebSGWorldData *world_data, collider_id_t collider_id) {
  JSValue collider = JS_NewObjectClass(ctx, js_websg_collider_class_id);

  if (JS_IsException(collider)) {
    return collider;
  }

  WebSGColliderData *collider_data = js_mallocz(ctx, sizeof(WebSGColliderData));
  collider_data->world_data = world_data;
  collider_data->collider_id = collider_id;
  JS_SetOpaque(collider, collider_data);

  JS_SetPropertyUint32(ctx, world_data->colliders, collider_id, JS_DupValue(ctx, collider));
  
  return collider;
}

JSValue js_websg_get_collider_by_id(JSContext *ctx, WebSGWorldData *world_data, collider_id_t collider_id) {
  JSValue collider = JS_GetPropertyUint32(ctx, world_data->colliders, collider_id);

  if (!JS_IsUndefined(collider)) {
    return JS_DupValue(ctx, collider);
  }

  return js_websg_new_collider_instance(ctx, world_data, collider_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_collider(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);
  
  ColliderProps *props = js_mallocz(ctx, sizeof(ColliderProps));

  JSValue type = JS_GetPropertyStr(ctx, argv[0], "type");

  ColliderType collider_type =  get_collider_type_from_atom(JS_ValueToAtom(ctx, type));

  if (collider_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown collider type.");
    js_free(ctx, props);
    return JS_EXCEPTION;
  }

  JSValue is_trigger_val = JS_GetPropertyStr(ctx, argv[0], "isTrigger");

  if (!JS_IsUndefined(is_trigger_val)) {
    int is_trigger = JS_ToBool(ctx, is_trigger_val);

    if (is_trigger < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->is_trigger = is_trigger;
  }

  JSValue size_val = JS_GetPropertyStr(ctx, argv[0], "size");

  if (!JS_IsUndefined(size_val)) {
    if (js_get_float_array_like(ctx, size_val, props->size, 3) < 0) {
      js_free(ctx, props);
      return JS_EXCEPTION;}
  }

  JSValue radius_val = JS_GetPropertyStr(ctx, argv[0], "radius");

  if (!JS_IsUndefined(radius_val)) {
    double_t radius;

    if (JS_ToFloat64(ctx, &radius, radius_val) == -1) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->radius = (float_t)radius;
  }

  JSValue height_val = JS_GetPropertyStr(ctx, argv[0], "height");

  if (!JS_IsUndefined(height_val)) {
    double_t height;

    if (JS_ToFloat64(ctx, &height, height_val) == -1) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->height = (float_t)height;
  }

  JSValue mesh_val = JS_GetPropertyStr(ctx, argv[0], "mesh");

  if (!JS_IsUndefined(mesh_val)) {
    WebSGMeshData *mesh_data = JS_GetOpaque2(ctx, mesh_val, js_websg_mesh_class_id);

    if (mesh_data == NULL) {
      js_free(ctx, props);
      return JS_EXCEPTION;
    }

    props->mesh = mesh_data->mesh_id;
  }

  collider_id_t collider_id = websg_world_create_collider(props);

  js_free(ctx, props);

  if (collider_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create collider.");
    return JS_EXCEPTION;
  }

  return js_websg_new_collider_instance(ctx, world_data, collider_id);
}

JSValue js_websg_world_find_collider_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  collider_id_t collider_id = websg_world_find_collider_by_name(name, length);

  if (collider_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_collider_by_id(ctx, world_data, collider_id);
}
