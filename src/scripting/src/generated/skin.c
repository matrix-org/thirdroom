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
#include "skin.h"
#include "node.h"
#include "accessor.h"

/**
 * WebSG.Skin
 */

JSClassID js_skin_class_id;

static JSValue js_skin_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Skin *skin = js_mallocz(ctx, sizeof(Skin));

  

  if (websg_create_resource(ResourceType_Skin, skin)) {
    return JS_EXCEPTION;
  }

  return create_skin_from_ptr(ctx, skin);
}


static JSValue js_skin_get_name(JSContext *ctx, JSValueConst this_val) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, skin->name);
    return val;
  }
}


static JSValue js_skin_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    skin->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}

static JSValue js_skin_joints(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefArrayIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_node_from_ptr, (void **)skin->joints, countof(skin->joints));
  }
}

static JSValue js_skin_add_joint(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    return JS_AddRefArrayItem(ctx, js_node_class_id, (void **)skin->joints, countof(skin->joints), argv[0]);
  }
}

static JSValue js_skin_remove_joint(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    return JS_RemoveRefArrayItem(ctx, js_node_class_id, (void **)skin->joints, countof(skin->joints), argv[0]);
  }
}

static JSValue js_skin_get_inverse_bind_matrices(JSContext *ctx, JSValueConst this_val) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_accessor_from_ptr(ctx, skin->inverse_bind_matrices);
    return val;
  }
}


static JSValue js_skin_set_inverse_bind_matrices(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Skin *skin = JS_GetOpaque2(ctx, this_val, js_skin_class_id);

  if (!skin) {
    return JS_EXCEPTION;
  } else {
    skin->inverse_bind_matrices = JS_GetOpaque(val, js_accessor_class_id);
    return JS_UNDEFINED;
  }
}




static JSValue js_skin_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Skin *skin = JS_GetOpaque(this_val, js_skin_class_id);
  websg_dispose_resource(skin);
  js_free(ctx, skin);
  return JS_UNDEFINED;
}

static JSClassDef js_skin_class = {
  "Skin"
};

static const JSCFunctionListEntry js_skin_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_skin_get_name, js_skin_set_name),
  JS_CFUNC_DEF("joints", 0, js_skin_joints),
  JS_CFUNC_DEF("addJoint", 1, js_skin_add_joint),
  JS_CFUNC_DEF("removeJoint", 1, js_skin_remove_joint),
  JS_CGETSET_DEF("inverseBindMatrices", js_skin_get_inverse_bind_matrices, js_skin_set_inverse_bind_matrices),
  JS_CFUNC_DEF("dispose", 0, js_skin_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Skin", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_skin_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_skin_class_id);
  JS_NewClass(rt, js_skin_class_id, &js_skin_class);

  JSValue skin_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, skin_proto, js_skin_proto_funcs, countof(js_skin_proto_funcs));
  
  JSValue skin_class = JS_NewCFunction2(ctx, js_skin_constructor, "Skin", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, skin_class, skin_proto);
  JS_SetClassProto(ctx, js_skin_class_id, skin_proto);

  return skin_class;
}

/**
 * WebSG.Skin related functions
*/

static JSValue js_get_skin_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Skin *skin = websg_get_resource_by_name(ResourceType_Skin, name);
  JS_FreeCString(ctx, name);
  return create_skin_from_ptr(ctx, skin);
}

JSValue create_skin_from_ptr(JSContext *ctx, Skin *skin) {
  if (!skin) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, skin);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_skin_class_id);
    
    JS_SetOpaque(val, skin);
    set_js_val_from_ptr(ctx, skin, val);
  }

  return val;
}

void js_define_skin_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Skin", js_define_skin_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getSkinByName",
    JS_NewCFunction(ctx, js_get_skin_by_name, "getSkinByName", 1)
  );
}