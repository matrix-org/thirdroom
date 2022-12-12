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
#include "camera.h"

/**
 * WebSG.Camera
 */

JSClassID js_camera_class_id;

static JSValue js_camera_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Camera *camera = js_mallocz(ctx, sizeof(Camera));

  

  if (websg_create_resource(ResourceType_Camera, camera)) {
    return JS_EXCEPTION;
  }

  return create_camera_from_ptr(ctx, camera);
}


static JSValue js_camera_get_name(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, camera->name);
    return val;
  }
}


static JSValue js_camera_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    camera->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_type(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, camera->type);
    return val;
  }
}


static JSValue js_camera_get_layers(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, camera->layers);
    return val;
  }
}


static JSValue js_camera_set_layers(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &camera->layers, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_zfar(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)camera->zfar);
    return val;
  }
}


static JSValue js_camera_set_zfar(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &camera->zfar, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_znear(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)camera->znear);
    return val;
  }
}


static JSValue js_camera_set_znear(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &camera->znear, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_xmag(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)camera->xmag);
    return val;
  }
}


static JSValue js_camera_set_xmag(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &camera->xmag, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_ymag(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)camera->ymag);
    return val;
  }
}


static JSValue js_camera_set_ymag(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &camera->ymag, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_yfov(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)camera->yfov);
    return val;
  }
}


static JSValue js_camera_set_yfov(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &camera->yfov, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_aspect_ratio(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)camera->aspect_ratio);
    return val;
  }
}


static JSValue js_camera_set_aspect_ratio(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &camera->aspect_ratio, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_camera_get_projection_matrix_needs_update(JSContext *ctx, JSValueConst this_val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, camera->projection_matrix_needs_update);
    return val;
  }
}


static JSValue js_camera_set_projection_matrix_needs_update(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Camera *camera = JS_GetOpaque2(ctx, this_val, js_camera_class_id);

  if (!camera) {
    return JS_EXCEPTION;
  } else {
    camera->projection_matrix_needs_update = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}




static JSValue js_camera_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Camera *camera = JS_GetOpaque(this_val, js_camera_class_id);
  websg_dispose_resource(camera);
  js_free(ctx, camera);
  return JS_UNDEFINED;
}

static JSClassDef js_camera_class = {
  "Camera"
};

static const JSCFunctionListEntry js_camera_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_camera_get_name, js_camera_set_name),
  JS_CGETSET_DEF("type", js_camera_get_type, NULL),
  JS_CGETSET_DEF("layers", js_camera_get_layers, js_camera_set_layers),
  JS_CGETSET_DEF("zfar", js_camera_get_zfar, js_camera_set_zfar),
  JS_CGETSET_DEF("znear", js_camera_get_znear, js_camera_set_znear),
  JS_CGETSET_DEF("xmag", js_camera_get_xmag, js_camera_set_xmag),
  JS_CGETSET_DEF("ymag", js_camera_get_ymag, js_camera_set_ymag),
  JS_CGETSET_DEF("yfov", js_camera_get_yfov, js_camera_set_yfov),
  JS_CGETSET_DEF("aspectRatio", js_camera_get_aspect_ratio, js_camera_set_aspect_ratio),
  JS_CGETSET_DEF("projectionMatrixNeedsUpdate", js_camera_get_projection_matrix_needs_update, js_camera_set_projection_matrix_needs_update),
  JS_CFUNC_DEF("dispose", 0, js_camera_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Camera", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_camera_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_camera_class_id);
  JS_NewClass(rt, js_camera_class_id, &js_camera_class);

  JSValue camera_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, camera_proto, js_camera_proto_funcs, countof(js_camera_proto_funcs));
  
  JSValue camera_class = JS_NewCFunction2(ctx, js_camera_constructor, "Camera", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, camera_class, camera_proto);
  JS_SetClassProto(ctx, js_camera_class_id, camera_proto);

  return camera_class;
}

/**
 * WebSG.Camera related functions
*/

static JSValue js_get_camera_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Camera *camera = websg_get_resource_by_name(ResourceType_Camera, name);
  JS_FreeCString(ctx, name);
  return create_camera_from_ptr(ctx, camera);
}

JSValue create_camera_from_ptr(JSContext *ctx, Camera *camera) {
  if (!camera) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, camera);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_camera_class_id);
    
    JS_SetOpaque(val, camera);
    set_js_val_from_ptr(ctx, camera, val);
  }

  return val;
}

void js_define_camera_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Camera", js_define_camera_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getCameraByName",
    JS_NewCFunction(ctx, js_get_camera_by_name, "getCameraByName", 1)
  );
}