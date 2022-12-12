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
#include "mesh.h"
#include "light.h"
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
  JS_CGETSET_DEF("name", js_node_get_name, js_node_set_name),
  JS_CGETSET_DEF("mesh", js_node_get_mesh, js_node_set_mesh),
  JS_CGETSET_DEF("light", js_node_get_light, js_node_set_light),
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