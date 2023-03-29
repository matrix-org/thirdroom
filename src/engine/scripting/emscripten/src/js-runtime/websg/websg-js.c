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
#include "./network.h"
#include "./node.h"
#include "./physics-body.h"
#include "./quaternion.h"
#include "./rgb.h"
#include "./rgba.h"
#include "./scene.h"
#include "./ui.h"
#include "./vector3.h"
#include "./world.h"

void js_define_websg_api(JSContext *ctx) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue websg = JS_NewObject(ctx);
  js_websg_define_accessor(ctx, websg);
  js_websg_define_collider(ctx, websg);
  js_websg_define_interactable(ctx, websg);
  js_websg_define_light(ctx, websg);
  js_websg_define_material(ctx, websg);
  js_websg_define_matrix4(ctx, websg);
  js_websg_define_mesh_primitive(ctx, websg);
  js_websg_define_mesh(ctx, websg);
  js_websg_define_network(ctx, websg);
  js_websg_define_node(ctx, websg);
  js_websg_define_physics_body(ctx, websg);
  js_websg_define_quaternion(ctx, websg);
  js_websg_define_rgb(ctx, websg);
  js_websg_define_rgba(ctx, websg);
  js_websg_define_scene(ctx, websg);
  js_websg_define_ui(ctx, websg);
  js_websg_define_vector3(ctx, websg);
  js_websg_define_world(ctx, websg);
  JS_SetPropertyStr(ctx, global, "WebSG", websg);

  JSValue world = js_websg_new_world(ctx);
  JS_SetPropertyStr(ctx, global, "world", world);
}