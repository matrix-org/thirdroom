JSAtom physicsBodyTypeStatic;
JSAtom physicsBodyTypeKinematic;
JSAtom physicsBodyTypeRigid;

PhysicsBodyType get_physics_body_type_from_atom(JSAtom atom) {
  if (atom == physicsBodyTypeStatic) {
    return PhysicsBodyType_Static;
  } else if (atom == physicsBodyTypeKinematic) {
    return PhysicsBodyType_Kinematic;
  } else if (atom == physicsBodyTypeRigid) {
    return PhysicsBodyType_Rigid;
  } else {
    return -1;
  }
}

static JSValue js_add_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  PhysicsBodyProps *props = js_malloc(ctx, sizeof(PhysicsBodyProps));

  JSValue typeVal = JS_GetPropertyStr(ctx, argv[1], "type");

  PhysicsBodyType physics_body_type = get_physics_body_type_from_atom(JS_ValueToAtom(ctx, typeVal));

  if (physics_body_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown physics body type.");
    return JS_EXCEPTION;
  }

  props->type = physics_body_type;

  JSValue linear_velocity_val = JS_GetPropertyStr(ctx, argv[1], "linearVelocity");

  if (!JS_IsUndefined(linear_velocity_val)) {
    float_t *linear_velocity = get_typed_array_data(ctx, &linear_velocity_val, sizeof(float_t) * 3);

    if (linear_velocity == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->linear_velocity, linear_velocity, sizeof(float_t) * 3);
  }

  JSValue angular_velocity_val = JS_GetPropertyStr(ctx, argv[1], "angularVelocity");

  if (!JS_IsUndefined(angular_velocity_val)) {
    float_t *angular_velocity = get_typed_array_data(ctx, &angular_velocity_val, sizeof(float_t) * 3);

    if (angular_velocity == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->angular_velocity, angular_velocity, sizeof(float_t) * 3);
  }

  JSValue inertia_tensor_val = JS_GetPropertyStr(ctx, argv[1], "inertiaTensor");

  if (!JS_IsUndefined(inertia_tensor_val)) {
    float_t *inertia_tensor = get_typed_array_data(ctx, &inertia_tensor_val, sizeof(float_t) * 9);

    if (inertia_tensor == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->inertia_tensor, inertia_tensor, sizeof(float_t) * 9);
  }

  int32_t result = websg_add_physics_body(node_id, props);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error adding physics body.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_remove_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_remove_physics_body(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error removing physics body.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_has_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_has_physics_body(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error checking for physics_body.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

physicsBodyTypeKinematic = JS_NewAtom(ctx, "kinematic");
physicsBodyTypeRigid = JS_NewAtom(ctx, "rigid");
physicsBodyTypeStatic = JS_NewAtom(ctx, "static");

JSValue physics_body_type = JS_NewObject(ctx);
JS_SetPropertyStr(ctx, physics_body_type, "Kinematic", JS_AtomToValue(ctx, physicsBodyTypeKinematic));
JS_SetPropertyStr(ctx, physics_body_type, "Rigid", JS_AtomToValue(ctx, physicsBodyTypeRigid));
JS_SetPropertyStr(ctx, physics_body_type, "Static", JS_AtomToValue(ctx, physicsBodyTypeStatic));
JS_SetPropertyStr(ctx, websg, "PhysicsBodyType", physics_body_type);