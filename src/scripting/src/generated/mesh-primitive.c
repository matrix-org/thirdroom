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
#include "mesh-primitive.h"
#include "material.h"

/**
 * WebSG.MeshPrimitive
 */

JSClassID js_mesh_primitive_class_id;

static JSValue js_mesh_primitive_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  MeshPrimitive *mesh_primitive = js_mallocz(ctx, sizeof(MeshPrimitive));

  

  if (websg_create_resource(ResourceType_MeshPrimitive, mesh_primitive)) {
    return JS_EXCEPTION;
  }

  return create_mesh_primitive_from_ptr(ctx, mesh_primitive);
}


static JSValue js_mesh_primitive_get_material(JSContext *ctx, JSValueConst this_val) {
  MeshPrimitive *mesh_primitive = JS_GetOpaque2(ctx, this_val, js_mesh_primitive_class_id);

  if (!mesh_primitive) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_material_from_ptr(ctx, mesh_primitive->material);
    return val;
  }
}


static JSValue js_mesh_primitive_set_material(JSContext *ctx, JSValueConst this_val, JSValue val) {
  MeshPrimitive *mesh_primitive = JS_GetOpaque2(ctx, this_val, js_mesh_primitive_class_id);

  if (!mesh_primitive) {
    return JS_EXCEPTION;
  } else {
    mesh_primitive->material = JS_GetOpaque(val, js_material_class_id);
    return JS_UNDEFINED;
  }
}




static JSValue js_mesh_primitive_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  MeshPrimitive *mesh_primitive = JS_GetOpaque(this_val, js_mesh_primitive_class_id);
  websg_dispose_resource(mesh_primitive);
  js_free(ctx, mesh_primitive);
  return JS_UNDEFINED;
}

static JSClassDef js_mesh_primitive_class = {
  "MeshPrimitive"
};

static const JSCFunctionListEntry js_mesh_primitive_proto_funcs[] = {
  JS_CGETSET_DEF("material", js_mesh_primitive_get_material, js_mesh_primitive_set_material),
  JS_CFUNC_DEF("dispose", 0, js_mesh_primitive_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "MeshPrimitive", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_mesh_primitive_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_mesh_primitive_class_id);
  JS_NewClass(rt, js_mesh_primitive_class_id, &js_mesh_primitive_class);

  JSValue mesh_primitive_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, mesh_primitive_proto, js_mesh_primitive_proto_funcs, countof(js_mesh_primitive_proto_funcs));
  
  JSValue mesh_primitive_class = JS_NewCFunction2(ctx, js_mesh_primitive_constructor, "MeshPrimitive", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, mesh_primitive_class, mesh_primitive_proto);
  JS_SetClassProto(ctx, js_mesh_primitive_class_id, mesh_primitive_proto);

  return mesh_primitive_class;
}

/**
 * WebSG.MeshPrimitive related functions
*/

static JSValue js_get_mesh_primitive_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  MeshPrimitive *mesh_primitive = websg_get_resource_by_name(ResourceType_MeshPrimitive, name);
  JS_FreeCString(ctx, name);
  return create_mesh_primitive_from_ptr(ctx, mesh_primitive);
}

JSValue create_mesh_primitive_from_ptr(JSContext *ctx, MeshPrimitive *mesh_primitive) {
  if (!mesh_primitive) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, mesh_primitive);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_mesh_primitive_class_id);
    
    JS_SetOpaque(val, mesh_primitive);
    set_js_val_from_ptr(ctx, mesh_primitive, val);
  }

  return val;
}

void js_define_mesh_primitive_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "MeshPrimitive", js_define_mesh_primitive_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getMeshPrimitiveByName",
    JS_NewCFunction(ctx, js_get_mesh_primitive_by_name, "getMeshPrimitiveByName", 1)
  );
}