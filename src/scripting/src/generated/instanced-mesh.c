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
#include "instanced-mesh.h"
#include "accessor.h"

/**
 * WebSG.InstancedMesh
 */

JSClassID js_instanced_mesh_class_id;

static JSValue js_instanced_mesh_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  InstancedMesh *instanced_mesh = js_mallocz(ctx, sizeof(InstancedMesh));

  

  if (websg_create_resource(ResourceType_InstancedMesh, instanced_mesh)) {
    return JS_EXCEPTION;
  }

  return create_instanced_mesh_from_ptr(ctx, instanced_mesh);
}


static JSValue js_instanced_mesh_get_name(JSContext *ctx, JSValueConst this_val) {
  InstancedMesh *instanced_mesh = JS_GetOpaque2(ctx, this_val, js_instanced_mesh_class_id);

  if (!instanced_mesh) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, instanced_mesh->name);
    return val;
  }
}


static JSValue js_instanced_mesh_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  InstancedMesh *instanced_mesh = JS_GetOpaque2(ctx, this_val, js_instanced_mesh_class_id);

  if (!instanced_mesh) {
    return JS_EXCEPTION;
  } else {
    instanced_mesh->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}

static JSValue js_instanced_mesh_attributes(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  InstancedMesh *instanced_mesh = JS_GetOpaque2(ctx, this_val, js_instanced_mesh_class_id);

  if (!instanced_mesh) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefMapIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_accessor_from_ptr, (void **)instanced_mesh->attributes, countof(instanced_mesh->attributes));
  }
}
  
static JSValue js_instanced_mesh_get_attribute(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  InstancedMesh *instanced_mesh = JS_GetOpaque2(ctx, this_val, js_instanced_mesh_class_id);

  if (!instanced_mesh) {
    return JS_EXCEPTION;
  } else {
    return JS_GetRefMapItem(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_accessor_from_ptr, (void **)instanced_mesh->attributes, countof(instanced_mesh->attributes), argv[0]);
  }
}

static JSValue js_instanced_mesh_set_attribute(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  InstancedMesh *instanced_mesh = JS_GetOpaque2(ctx, this_val, js_instanced_mesh_class_id);

  if (!instanced_mesh) {
    return JS_EXCEPTION;
  } else {
    return JS_SetRefMapItem(ctx, (void **)instanced_mesh->attributes, countof(instanced_mesh->attributes), argv[0], argv[1]);
  }
}

static JSValue js_instanced_mesh_delete_attribute(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  InstancedMesh *instanced_mesh = JS_GetOpaque2(ctx, this_val, js_instanced_mesh_class_id);

  if (!instanced_mesh) {
    return JS_EXCEPTION;
  } else {
    return JS_DeleteRefMapItem(ctx, (void **)instanced_mesh->attributes, countof(instanced_mesh->attributes), argv[0]);
  }
}



static JSValue js_instanced_mesh_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  InstancedMesh *instanced_mesh = JS_GetOpaque(this_val, js_instanced_mesh_class_id);
  websg_dispose_resource(instanced_mesh);
  js_free(ctx, instanced_mesh);
  return JS_UNDEFINED;
}

static JSClassDef js_instanced_mesh_class = {
  "InstancedMesh"
};

static const JSCFunctionListEntry js_instanced_mesh_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_instanced_mesh_get_name, js_instanced_mesh_set_name),
  JS_CFUNC_DEF("attributes", 0, js_instanced_mesh_attributes),
  JS_CFUNC_DEF("getAttribute", 1, js_instanced_mesh_get_attribute),
  JS_CFUNC_DEF("setAttribute", 1, js_instanced_mesh_set_attribute),
  JS_CFUNC_DEF("deleteAttribute", 1, js_instanced_mesh_delete_attribute),
  JS_CFUNC_DEF("dispose", 0, js_instanced_mesh_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "InstancedMesh", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_instanced_mesh_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_instanced_mesh_class_id);
  JS_NewClass(rt, js_instanced_mesh_class_id, &js_instanced_mesh_class);

  JSValue instanced_mesh_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, instanced_mesh_proto, js_instanced_mesh_proto_funcs, countof(js_instanced_mesh_proto_funcs));
  
  JSValue instanced_mesh_class = JS_NewCFunction2(ctx, js_instanced_mesh_constructor, "InstancedMesh", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, instanced_mesh_class, instanced_mesh_proto);
  JS_SetClassProto(ctx, js_instanced_mesh_class_id, instanced_mesh_proto);

  return instanced_mesh_class;
}

/**
 * WebSG.InstancedMesh related functions
*/

static JSValue js_get_instanced_mesh_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  InstancedMesh *instanced_mesh = websg_get_resource_by_name(ResourceType_InstancedMesh, name);
  JS_FreeCString(ctx, name);
  return create_instanced_mesh_from_ptr(ctx, instanced_mesh);
}

JSValue create_instanced_mesh_from_ptr(JSContext *ctx, InstancedMesh *instanced_mesh) {
  if (!instanced_mesh) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, instanced_mesh);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_instanced_mesh_class_id);
    
    JS_SetOpaque(val, instanced_mesh);
    set_js_val_from_ptr(ctx, instanced_mesh, val);
  }

  return val;
}

void js_define_instanced_mesh_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "InstancedMesh", js_define_instanced_mesh_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getInstancedMeshByName",
    JS_NewCFunction(ctx, js_get_instanced_mesh_by_name, "getInstancedMeshByName", 1)
  );
}