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
#include "./vector2.h"
#include "./vector3.h"
#include "./vector4.h"
#include "./world.h"
#include "./component-store.h"
#include "./component.h"
#include "./query.h"
#include "./collision-iterator.h"
#include "./collision-listener.h"
#include "./collision.h"

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
  js_websg_define_vector2(ctx, websg);
  js_websg_define_vector3(ctx, websg);
  js_websg_define_vector4(ctx, websg);
  js_websg_define_world(ctx, websg);
  js_websg_define_query(ctx, websg);
  js_websg_define_component(ctx, websg);
  js_websg_define_component_store(ctx, websg);
  js_websg_define_collision_listener(ctx, websg);
  js_websg_define_collision_iterator(ctx);
  js_websg_define_collision(ctx, websg);
  JS_SetPropertyStr(ctx, global, "WebSG", websg);

  JSValue world = js_websg_new_world(ctx);
  JS_SetPropertyStr(ctx, global, "world", world);
}