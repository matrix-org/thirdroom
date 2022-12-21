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
#include "node.h"
#include "scene.h"
#include "mesh.h"
#include "instanced-mesh.h"
#include "light-map.h"
#include "skin.h"
#include "light.h"
#include "reflection-probe.h"
#include "camera.h"
#include "audio-emitter.h"
#include "tiles-renderer.h"
#include "nametag.h"
#include "interactable.h"

/**
 * WebSG.Node
 */

JSClassID js_node_class_id;

static JSValue js_node_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Node *node = js_mallocz(ctx, sizeof(Node));

  

  if (websg_create_resource(ResourceType_Node, node)) {
    return JS_EXCEPTION;
  }

  return create_node_from_ptr(ctx, node);
}


static JSValue js_node_get_eid(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, node->eid);
    return val;
  }
}


static JSValue js_node_get_name(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, node->name);
    return val;
  }
}


static JSValue js_node_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_world_matrix_needs_update(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, node->world_matrix_needs_update);
    return val;
  }
}


static JSValue js_node_set_world_matrix_needs_update(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->world_matrix_needs_update = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_visible(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, node->visible);
    return val;
  }
}


static JSValue js_node_set_visible(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->visible = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_enabled(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, node->enabled);
    return val;
  }
}


static JSValue js_node_set_enabled(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->enabled = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_skip_lerp(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, node->skip_lerp);
    return val;
  }
}


static JSValue js_node_set_skip_lerp(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &node->skip_lerp, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_is_static(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, node->is_static);
    return val;
  }
}


static JSValue js_node_set_is_static(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->is_static = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_layers(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, node->layers);
    return val;
  }
}


static JSValue js_node_set_layers(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &node->layers, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_mesh(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_mesh_from_ptr(ctx, node->mesh);
    return val;
  }
}


static JSValue js_node_set_mesh(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->mesh = JS_GetOpaque(val, js_mesh_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_instanced_mesh(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_instanced_mesh_from_ptr(ctx, node->instanced_mesh);
    return val;
  }
}


static JSValue js_node_set_instanced_mesh(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->instanced_mesh = JS_GetOpaque(val, js_instanced_mesh_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_light_map(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_light_map_from_ptr(ctx, node->light_map);
    return val;
  }
}


static JSValue js_node_set_light_map(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->light_map = JS_GetOpaque(val, js_light_map_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_skin(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_skin_from_ptr(ctx, node->skin);
    return val;
  }
}


static JSValue js_node_set_skin(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->skin = JS_GetOpaque(val, js_skin_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_light(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_light_from_ptr(ctx, node->light);
    return val;
  }
}


static JSValue js_node_set_light(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->light = JS_GetOpaque(val, js_light_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_reflection_probe(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_reflection_probe_from_ptr(ctx, node->reflection_probe);
    return val;
  }
}


static JSValue js_node_set_reflection_probe(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->reflection_probe = JS_GetOpaque(val, js_reflection_probe_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_camera(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_camera_from_ptr(ctx, node->camera);
    return val;
  }
}


static JSValue js_node_set_camera(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->camera = JS_GetOpaque(val, js_camera_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_audio_emitter(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_audio_emitter_from_ptr(ctx, node->audio_emitter);
    return val;
  }
}


static JSValue js_node_set_audio_emitter(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->audio_emitter = JS_GetOpaque(val, js_audio_emitter_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_tiles_renderer(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_tiles_renderer_from_ptr(ctx, node->tiles_renderer);
    return val;
  }
}


static JSValue js_node_set_tiles_renderer(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->tiles_renderer = JS_GetOpaque(val, js_tiles_renderer_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_node_get_interactable(JSContext *ctx, JSValueConst this_val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_interactable_from_ptr(ctx, node->interactable);
    return val;
  }
}


static JSValue js_node_set_interactable(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

  if (!node) {
    return JS_EXCEPTION;
  } else {
    node->interactable = JS_GetOpaque(val, js_interactable_class_id);
    return JS_UNDEFINED;
  }
}




static JSValue js_node_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Node *node = JS_GetOpaque(this_val, js_node_class_id);
  websg_dispose_resource(node);
  js_free(ctx, node);
  return JS_UNDEFINED;
}

static JSClassDef js_node_class = {
  "Node"
};

static const JSCFunctionListEntry js_node_proto_funcs[] = {
  JS_CGETSET_DEF("eid", js_node_get_eid, NULL),
  JS_CGETSET_DEF("name", js_node_get_name, js_node_set_name),
  JS_CGETSET_DEF("worldMatrixNeedsUpdate", js_node_get_world_matrix_needs_update, js_node_set_world_matrix_needs_update),
  JS_CGETSET_DEF("visible", js_node_get_visible, js_node_set_visible),
  JS_CGETSET_DEF("enabled", js_node_get_enabled, js_node_set_enabled),
  JS_CGETSET_DEF("skipLerp", js_node_get_skip_lerp, js_node_set_skip_lerp),
  JS_CGETSET_DEF("isStatic", js_node_get_is_static, js_node_set_is_static),
  JS_CGETSET_DEF("layers", js_node_get_layers, js_node_set_layers),
  JS_CGETSET_DEF("mesh", js_node_get_mesh, js_node_set_mesh),
  JS_CGETSET_DEF("instancedMesh", js_node_get_instanced_mesh, js_node_set_instanced_mesh),
  JS_CGETSET_DEF("lightMap", js_node_get_light_map, js_node_set_light_map),
  JS_CGETSET_DEF("skin", js_node_get_skin, js_node_set_skin),
  JS_CGETSET_DEF("light", js_node_get_light, js_node_set_light),
  JS_CGETSET_DEF("reflectionProbe", js_node_get_reflection_probe, js_node_set_reflection_probe),
  JS_CGETSET_DEF("camera", js_node_get_camera, js_node_set_camera),
  JS_CGETSET_DEF("audioEmitter", js_node_get_audio_emitter, js_node_set_audio_emitter),
  JS_CGETSET_DEF("tilesRenderer", js_node_get_tiles_renderer, js_node_set_tiles_renderer),
  JS_CGETSET_DEF("interactable", js_node_get_interactable, js_node_set_interactable),
  JS_CFUNC_DEF("dispose", 0, js_node_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Node", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_node_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_node_class_id);
  JS_NewClass(rt, js_node_class_id, &js_node_class);

  JSValue node_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, node_proto, js_node_proto_funcs, countof(js_node_proto_funcs));
  
  JSValue node_class = JS_NewCFunction2(ctx, js_node_constructor, "Node", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, node_class, node_proto);
  JS_SetClassProto(ctx, js_node_class_id, node_proto);

  return node_class;
}

/**
 * WebSG.Node related functions
*/

static JSValue js_get_node_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Node *node = websg_get_resource_by_name(ResourceType_Node, name);
  JS_FreeCString(ctx, name);
  return create_node_from_ptr(ctx, node);
}

JSValue create_node_from_ptr(JSContext *ctx, Node *node) {
  if (!node) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, node);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_node_class_id);
    JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "position", node->position, 3);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "quaternion", node->quaternion, 4);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "scale", node->scale, 3);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "localMatrix", node->local_matrix, 16);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "worldMatrix", node->world_matrix, 16);
    JS_SetOpaque(val, node);
    set_js_val_from_ptr(ctx, node, val);
  }

  return val;
}

void js_define_node_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Node", js_define_node_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getNodeByName",
    JS_NewCFunction(ctx, js_get_node_by_name, "getNodeByName", 1)
  );
}