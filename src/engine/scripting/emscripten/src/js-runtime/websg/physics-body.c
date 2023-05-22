#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./node.h"
#include "./physics-body.h"
#include "../utils/array.h"

JSClassID js_websg_physics_body_class_id;

/**
 * Private Methods and Variables
 **/

JSAtom physics_body_type_static;
JSAtom physics_body_type_kinematic;
JSAtom physics_body_type_rigid;

PhysicsBodyType get_physics_body_type_from_atom(JSAtom atom) {
  if (atom == physics_body_type_static) {
    return PhysicsBodyType_Static;
  } else if (atom == physics_body_type_kinematic) {
    return PhysicsBodyType_Kinematic;
  } else if (atom == physics_body_type_rigid) {
    return PhysicsBodyType_Rigid;
  } else {
    return -1;
  }
}

/**
 * Class Definition
 **/

static void js_websg_physics_body_finalizer(JSRuntime *rt, JSValue val) {
  WebSGPhysicsBodyData *physics_body_data = JS_GetOpaque(val, js_websg_physics_body_class_id);

  if (physics_body_data) {
    js_free_rt(rt, physics_body_data);
  }
}

static JSClassDef js_websg_physics_body_class = {
  "PhysicsBody",
  .finalizer = js_websg_physics_body_finalizer
};

static JSValue js_websg_physics_body_apply_impulse(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGPhysicsBodyData *physics_body_data = JS_GetOpaque(this_val, js_websg_physics_body_class_id);

  float_t *impulse = js_mallocz(ctx, sizeof(float_t) * 3);

  if (js_get_float_array_like(ctx, argv[0], impulse, 3) < 0) {
    return JS_EXCEPTION;
  }

  if (websg_physics_body_apply_impulse(physics_body_data->node_id, impulse) == -1) {
    JS_ThrowInternalError(ctx, "WebSGPhysicsBody: error applying impulse.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_physics_body_proto_funcs[] = {
  JS_CFUNC_DEF("applyImpulse", 1, js_websg_physics_body_apply_impulse),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "PhysicsBody", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_physics_body_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_physics_body(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_physics_body_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_physics_body_class_id, &js_websg_physics_body_class);
  JSValue physics_body_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    physics_body_proto,
    js_websg_physics_body_proto_funcs,
    countof(js_websg_physics_body_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_physics_body_class_id, physics_body_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_physics_body_constructor,
    "PhysicsBody",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, physics_body_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "PhysicsBody",
    constructor
  );

  physics_body_type_kinematic = JS_NewAtom(ctx, "kinematic");
  physics_body_type_rigid = JS_NewAtom(ctx, "rigid");
  physics_body_type_static = JS_NewAtom(ctx, "static");

  JSValue physics_body_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, physics_body_type, "Kinematic", JS_AtomToValue(ctx, physics_body_type_kinematic));
  JS_SetPropertyStr(ctx, physics_body_type, "Rigid", JS_AtomToValue(ctx, physics_body_type_rigid));
  JS_SetPropertyStr(ctx, physics_body_type, "Static", JS_AtomToValue(ctx, physics_body_type_static));
  JS_SetPropertyStr(ctx, websg, "PhysicsBodyType", physics_body_type);
}

/**
 * Node Methods
 **/

JSValue js_websg_init_node_physics_body(JSContext *ctx, node_id_t node_id) {
  if (websg_node_has_physics_body(node_id) == 0) {
    return JS_UNDEFINED;
  }

  JSValue physics_body = JS_NewObjectClass(ctx, js_websg_physics_body_class_id);

  if (JS_IsException(physics_body)) {
    return physics_body;
  }

  WebSGPhysicsBodyData *physics_body_data = js_mallocz(ctx, sizeof(WebSGPhysicsBodyData));
  physics_body_data->node_id = node_id;
  JS_SetOpaque(physics_body, physics_body_data);
  
  return physics_body;
}

JSValue js_websg_node_add_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, js_websg_node_class_id);

  PhysicsBodyProps *props = js_mallocz(ctx, sizeof(PhysicsBodyProps));

  JSValue typeVal = JS_GetPropertyStr(ctx, argv[0], "type");

  PhysicsBodyType physics_body_type = get_physics_body_type_from_atom(JS_ValueToAtom(ctx, typeVal));

  if (physics_body_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown physics body type.");
    return JS_EXCEPTION;
  }

  props->type = physics_body_type;

  JSValue mass_val = JS_GetPropertyStr(ctx, argv[0], "mass");

  if (!JS_IsUndefined(mass_val)) {
    double mass;

    if (JS_ToFloat64(ctx, &mass, mass_val) == -1) {
      return JS_EXCEPTION;
    }

    props->mass = (float) mass;
  } else {
    props->mass = 1;
  }

  JSValue linear_velocity_val = JS_GetPropertyStr(ctx, argv[0], "linearVelocity");

  if (!JS_IsUndefined(linear_velocity_val)) {
    if (js_get_float_array_like(ctx, linear_velocity_val, props->linear_velocity, 3) < 0) {
      return JS_EXCEPTION;
    }
  }

  JSValue angular_velocity_val = JS_GetPropertyStr(ctx, argv[0], "angularVelocity");

  if (!JS_IsUndefined(angular_velocity_val)) {
    if (js_get_float_array_like(ctx, angular_velocity_val, props->angular_velocity, 3) < 0) {
      return JS_EXCEPTION;
    }
  }

  JSValue inertia_tensor_val = JS_GetPropertyStr(ctx, argv[0], "inertiaTensor");

  if (!JS_IsUndefined(inertia_tensor_val)) {
    if (js_get_float_array_like(ctx, inertia_tensor_val, props->inertia_tensor, 9) < 0) {
      return JS_EXCEPTION;
    }
  }

  int32_t result = websg_node_add_physics_body(node_data->node_id, props);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error adding physics body.");
    return JS_EXCEPTION;
  }

  JSValue physics_body = JS_NewObjectClass(ctx, js_websg_physics_body_class_id);

  if (JS_IsException(physics_body)) {
    return physics_body;
  }

  WebSGPhysicsBodyData *physics_body_data = js_mallocz(ctx, sizeof(WebSGPhysicsBodyData));
  physics_body_data->node_id = node_data->node_id;
  JS_SetOpaque(physics_body, physics_body_data);

  node_data->physics_body = JS_DupValue(ctx, physics_body);

  return physics_body;
}

JSValue js_websg_node_remove_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, js_websg_node_class_id);

  int32_t result = websg_node_remove_physics_body(node_data->node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error removing physics_body.");
    return JS_EXCEPTION;
  }

  JS_FreeValue(ctx, node_data->physics_body);

  node_data->physics_body = JS_UNDEFINED;

  return JS_UNDEFINED;
}

JSValue js_websg_node_get_physics_body(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, js_websg_node_class_id);

  if (websg_node_has_physics_body(node_data->node_id) && JS_IsUndefined(node_data->physics_body)) {
    JSValue physics_body = JS_NewObjectClass(ctx, js_websg_physics_body_class_id);

    if (JS_IsException(physics_body)) {
      return physics_body;
    }

    WebSGPhysicsBodyData *physics_body_data = js_mallocz(ctx, sizeof(WebSGPhysicsBodyData));
    physics_body_data->node_id = node_data->node_id;

    JS_SetOpaque(physics_body, physics_body_data);

    node_data->physics_body = physics_body;

    return node_data->physics_body;
  }

  return JS_DupValue(ctx, node_data->physics_body);
}
