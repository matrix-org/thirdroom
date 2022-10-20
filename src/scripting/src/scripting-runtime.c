#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

/**
 * Global State
 **/

JSRuntime *rt;
JSContext *ctx;

/************************
 * JS API Implementation
 ************************/

/**
 * console API
 **/

static JSValue js_console_log(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  for(int i = 0; i < argc; i++) {
    const char *str = JS_ToCString(ctx, argv[i]);

    if (!str)
      return JS_EXCEPTION;

    emscripten_console_logf("%s", str);

    JS_FreeCString(ctx, str);
  }

  return JS_UNDEFINED;
}

/**
 * Web Assembly Scene Graph Interface (WASGI) Implementation
 **/

#define WASGI_IMPORT(NAME) __attribute__((import_module("wasgi"), import_name(#NAME)))

JSAtom onUpdateAtom;

typedef struct Node {
  uint32_t id;
  char *name;
  float_t position[3];
  float_t quaternion[4];
  float_t scale[3];
  struct Node *parent;
  struct Node *first_child;
  struct Node *next_sibling;
  struct Node *prev_sibling;
} Node;

Node* create_node(void) WASGI_IMPORT(create_node);

static JSClassID js_node_class_id;

static void js_node_finalizer(JSRuntime *rt, JSValue val)
{
    Node* node = JS_GetOpaque(val, js_node_class_id);
    js_free_rt(rt, node);
}

static JSClassDef js_node_class = {
    "Node",
    .finalizer = js_node_finalizer,
};

static JSValue js_node_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Node* node = create_node();
  JSValue nodeObj = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  // TODO: parse and set args on node

  if (JS_IsException(proto)) {
    free(node);
    JS_FreeValue(ctx, nodeObj);
    return JS_EXCEPTION;
  }
    
  nodeObj = JS_NewObjectProtoClass(ctx, proto, js_node_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(nodeObj)) {
    free(node);
    JS_FreeValue(ctx, nodeObj);
    return JS_EXCEPTION;
  }

  JSValue global = JS_GetGlobalObject(ctx);
  JSValue float32ArrayConstructor = JS_GetPropertyStr(ctx, global, "Float32Array");

  JSValue positionBuffer = JS_NewArrayBuffer(ctx, &node->position, sizeof(node->position), NULL, NULL, false);
  JSValue positionArgs[] = { positionBuffer, 0, 3 };
  JSValue position = JS_CallConstructor(ctx, float32ArrayConstructor, 3, positionArgs);
  JS_SetPropertyStr(ctx, nodeObj, "position", position);

  JSValue quaternionBuffer = JS_NewArrayBuffer(ctx, &node->quaternion, sizeof(node->quaternion), NULL, NULL, false);
  JSValue quaternionArgs[] = { quaternionBuffer, 0, 4 };
  JSValue quaternion = JS_CallConstructor(ctx, float32ArrayConstructor, 3, quaternionArgs);
  JS_SetPropertyStr(ctx, nodeObj, "quaternion", quaternion);

  JSValue scaleBuffer = JS_NewArrayBuffer(ctx, &node->scale, sizeof(node->scale), NULL, NULL, false);
  JSValue scaleArgs[] = { scaleBuffer, 0, 3 };
  JSValue scale = JS_CallConstructor(ctx, float32ArrayConstructor, 3, scaleArgs);
  JS_SetPropertyStr(ctx, nodeObj, "scale", scale);
    
  JS_SetOpaque(nodeObj, node);

  return nodeObj;
}

static JSValue js_node_get_id(JSContext *ctx, JSValueConst this_val)
{
    Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);
    if (!node)
        return JS_EXCEPTION;
    else
        return JS_NewInt32(ctx, node->id);
}

static const JSCFunctionListEntry js_node_proto_funcs[] = {
  JS_CGETSET_DEF("id", js_node_get_id, NULL)
};

static void define_js_node_class(JSRuntime *rt, JSContext *ctx, JSValue *target) {
  JS_NewClassID(&js_node_class_id);
  JS_NewClass(rt, js_node_class_id, &js_node_class);

  JSValue node_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, node_proto, js_node_proto_funcs, countof(js_node_proto_funcs));
  
  JSValue node_class = JS_NewCFunction2(ctx, js_node_constructor, "Node", 1, JS_CFUNC_constructor, 0);
  /* set proto.constructor and ctor.prototype */
  JS_SetConstructor(ctx, node_class, node_proto);
  JS_SetClassProto(ctx, js_node_class_id, node_proto);

  JS_SetPropertyStr(ctx, *target, "Node", node_class);
}


/*********************
 * Exported Functions
 *********************/

EMSCRIPTEN_KEEPALIVE
int32_t initialize() {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);

  JSValue global = JS_GetGlobalObject(ctx);

  JSValue console = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, console, "log", JS_NewCFunction(ctx, js_console_log, "log", 1));
  JS_SetPropertyStr(ctx, global, "console", console);

  onUpdateAtom = JS_NewAtom(ctx, "onupdate");

  JSValue jsSceneGraphNamespace = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, global, "WebSG", jsSceneGraphNamespace);
  define_js_node_class(rt, ctx, &jsSceneGraphNamespace);

  emscripten_console_log("Initialized");

  return 0; 
}

// NONSTANDARD: execute the provided code in the JS context
// Should be called immediately after initialize()
EMSCRIPTEN_KEEPALIVE
int32_t evalJS(const char * code) {
  JSValue val = JS_Eval(ctx, code, strlen(code), "<module>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);

    emscripten_console_errorf(
      "Error calling update(): %s\n  %s",
      JS_ToCString(ctx, error),
      JS_ToCString(ctx, JS_GetPropertyStr(ctx, error, "stack"))
    ); 

    JS_FreeValue(ctx, error);

    return -1;
  }

  return 0;
}

// Called 
EMSCRIPTEN_KEEPALIVE
int32_t update(float_t dt) {
  int32_t ret;

  JSValue global = JS_GetGlobalObject(ctx);

  JSValue updateFn = JS_GetProperty(ctx, global, onUpdateAtom);

  if (!JS_IsFunction(ctx, updateFn)) {
    JS_FreeValue(ctx, updateFn);
    return 0;
  }

  JSValue dtVal = JS_NewFloat64(ctx, dt);

  int argc = 1;
  JSValueConst argv[1] = { dtVal };

  JSValue val = JS_Call(ctx, updateFn, JS_UNDEFINED, argc, argv);

  JS_FreeValue(ctx, updateFn);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);

    emscripten_console_errorf("Error calling update(): %s", JS_ToCString(ctx, error));

    JS_FreeValue(ctx, error);

    ret = -1;
  } else {
    ret = 0;
  }

  JS_FreeValue(ctx, val);

  return ret;
}