#include "../quickjs/quickjs.h"

#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "../utils/typedarray.h"
#include "./websg-js.h"

#include "./accessor.h"
#include "./collider.h"
#include "./interactable.h"
#include "./light.h"
#include "./material.h"
#include "./matrix4.h"
#include "./mesh-primitive.h"
#include "./mesh.h"
#include "./node.h"
#include "./node-iterator.h"
#include "./physics-body.h"
#include "./quaternion.h"
#include "./rgb.h"
#include "./rgba.h"
#include "./scene.h"
#include "./texture.h"
#include "./ui-canvas.h"
#include "./ui-element.h"
#include "./ui-element-iterator.h"
#include "./ui-text.h"
#include "./ui-button.h"
#include "./vector3.h"
#include "./world.h"

static JSValue js_start_orbit(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  if (JS_IsUndefined(argv[0])) {
    JS_ThrowTypeError(ctx, "WebSG: Invalid arguments for startOrbit()");
    return JS_EXCEPTION;
  }

  WebSGNodeData *node_data = JS_GetOpaque2(ctx, argv[0], js_websg_node_class_id);

  if (node_data == NULL) {
    return JS_EXCEPTION;
  }

  CameraRigOptions *options = js_mallocz(ctx, sizeof(CameraRigOptions));

  if (!JS_IsUndefined(argv[1])) { 

    JSValue pitch_val = JS_GetPropertyStr(ctx, argv[1], "pitch");
    if (!JS_IsUndefined(pitch_val)) {
      double_t pitch;
      if (JS_ToFloat64(ctx, &pitch, pitch_val) == -1) {
        return JS_EXCEPTION;
      }
      options->pitch = (float_t)pitch;
    }

    JSValue yaw_val = JS_GetPropertyStr(ctx, argv[1], "yaw");
    if (!JS_IsUndefined(yaw_val)) {
      double_t yaw;
      if (JS_ToFloat64(ctx, &yaw, yaw_val) == -1) {
        return JS_EXCEPTION;
      }
      options->yaw = (float_t)yaw;
    }

    JSValue zoom_val = JS_GetPropertyStr(ctx, argv[1], "zoom");
    if (!JS_IsUndefined(zoom_val)) {
      double_t zoom;
      if (JS_ToFloat64(ctx, &zoom, zoom_val) == -1) {
        return JS_EXCEPTION;
      }
      options->zoom = (float_t)zoom;
    }
  
  }


  int32_t result = websg_node_start_orbit(node_data->node_id, options);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error starting orbit.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_stop_orbit(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  int32_t result = websg_stop_orbit();

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error stopping orbit.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

void js_define_websg_api(JSContext *ctx) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue websg = JS_NewObject(ctx);

  // Orbit Controls
  JS_SetPropertyStr(
    ctx,
    websg,
    "startOrbit",
    JS_NewCFunction(ctx, js_start_orbit, "startOrbit", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "stopOrbit",
    JS_NewCFunction(ctx, js_stop_orbit, "stopOrbit", 1)
  );

  js_websg_define_accessor(ctx, websg);
  js_websg_define_collider(ctx, websg);
  js_websg_define_interactable(ctx, websg);
  js_websg_define_light(ctx, websg);
  js_websg_define_material(ctx, websg);
  js_websg_define_matrix4(ctx, websg);
  js_websg_define_mesh_primitive(ctx, websg);
  js_websg_define_mesh(ctx, websg);
  js_websg_define_node(ctx, websg);
  js_websg_define_node_iterator(ctx);
  js_websg_define_physics_body(ctx, websg);
  js_websg_define_quaternion(ctx, websg);
  js_websg_define_rgb(ctx, websg);
  js_websg_define_rgba(ctx, websg);
  js_websg_define_scene(ctx, websg);
  js_websg_define_texture(ctx, websg);
  js_websg_define_ui_canvas(ctx, websg);
  js_websg_define_ui_element(ctx, websg);
  js_websg_define_ui_element_iterator(ctx);
  js_websg_define_ui_text(ctx, websg);
  js_websg_define_ui_button(ctx, websg);
  js_websg_define_vector3(ctx, websg);
  js_websg_define_world(ctx, websg);
  JS_SetPropertyStr(ctx, global, "WebSG", websg);

  JSValue world = js_websg_new_world(ctx);
  JS_SetPropertyStr(ctx, global, "world", world);
}