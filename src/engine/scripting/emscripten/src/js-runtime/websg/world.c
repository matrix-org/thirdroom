#include <string.h>

#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"

#include "../../websg.h"

#include "./world.h"

#include "./accessor.h"
#include "./collider.h"
#include "./light.h"
#include "./material.h"
#include "./mesh.h"
#include "./node.h"
#include "./scene.h"
#include "./ui-canvas.h"
#include "./ui-element.h"

JSClassID js_websg_world_class_id;

static JSClassDef js_websg_world_class = {
  "World"
};

static JSValue js_websg_world_get_environment(JSContext *ctx, JSValueConst this_val) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  scene_id_t scene_id = websg_world_get_environment();

  if (scene_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_scene_by_id(ctx, world_data, scene_id);
}

static JSValue js_websg_world_set_environment(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGSceneData *scene_data = JS_GetOpaque(arg, js_websg_scene_class_id);

  if (scene_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_world_set_environment(scene_data->scene_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't set environment scene.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_world_proto_funcs[] = {
  JS_CGETSET_DEF("environment", js_websg_world_get_environment, js_websg_world_set_environment),
  JS_CFUNC_DEF("createAccessorFrom", 1, js_websg_world_create_accessor_from),
  JS_CFUNC_DEF("findAccessorByName", 1, js_websg_world_find_accessor_by_name),
  JS_CFUNC_DEF("createCollider", 1, js_websg_world_create_collider),
  JS_CFUNC_DEF("findColliderByName", 1, js_websg_world_find_collider_by_name),
  JS_CFUNC_DEF("createLight", 1, js_websg_world_create_light),
  JS_CFUNC_DEF("findLightByName", 1, js_websg_world_find_light_by_name),
  JS_CFUNC_DEF("createMaterial", 1, js_websg_world_create_material),
  JS_CFUNC_DEF("createUnlitMaterial", 1, js_websg_world_create_unlit_material),
  JS_CFUNC_DEF("findMaterialByName", 1, js_websg_world_find_material_by_name),
  JS_CFUNC_DEF("createMesh", 1, js_websg_world_create_mesh),
  JS_CFUNC_DEF("createBoxMesh", 1, js_websg_world_create_box_mesh),
  JS_CFUNC_DEF("findMeshByName", 1, js_websg_world_find_mesh_by_name),
  JS_CFUNC_DEF("createNode", 1, js_websg_world_create_node),
  JS_CFUNC_DEF("findNodeByName", 1, js_websg_world_find_node_by_name),
  JS_CFUNC_DEF("createScene", 1, js_websg_world_create_scene),
  JS_CFUNC_DEF("findSceneByName", 1, js_websg_world_find_scene_by_name),
  JS_CFUNC_DEF("createUICanvas", 1, js_websg_world_create_ui_canvas),
  JS_CFUNC_DEF("findUICanvasByName", 1, js_websg_world_find_ui_canvas_by_name),
  JS_CFUNC_DEF("createUIElement", 1, js_websg_world_create_ui_element),
  JS_CFUNC_DEF("findUIElementByName", 1, js_websg_world_find_ui_element_by_name),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "World", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_world_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_world(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_world_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_world_class_id, &js_websg_world_class);
  JSValue world_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, world_proto, js_websg_world_proto_funcs, countof(js_websg_world_proto_funcs));
  JS_SetClassProto(ctx, js_websg_world_class_id, world_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_world_constructor,
    "World",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, world_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "World",
    constructor
  );
}

JSValue js_websg_new_world(JSContext *ctx) {
  JSValue world = JS_NewObjectClass(ctx, js_websg_world_class_id);

  if (JS_IsException(world)) {
    return world;
  }

  WebSGWorldData *world_data = js_mallocz(ctx, sizeof(WebSGWorldData));
  world_data->accessors = JS_NewObject(ctx);
  world_data->colliders = JS_NewObject(ctx);
  world_data->lights = JS_NewObject(ctx);
  world_data->materials = JS_NewObject(ctx);
  world_data->meshes = JS_NewObject(ctx);
  world_data->nodes = JS_NewObject(ctx);
  world_data->scenes = JS_NewObject(ctx);
  world_data->textures = JS_NewObject(ctx);
  world_data->ui_canvases = JS_NewObject(ctx);
  world_data->ui_elements = JS_NewObject(ctx);
  JS_SetOpaque(world, world_data);

  return world;
}
