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
#include "avatar.h"
#include "node.h"

/**
 * WebSG.Avatar
 */

JSClassID js_avatar_class_id;

static JSValue js_avatar_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Avatar *avatar = js_mallocz(ctx, sizeof(Avatar));

  

  if (websg_create_resource(ResourceType_Avatar, avatar)) {
    return JS_EXCEPTION;
  }

  return create_avatar_from_ptr(ctx, avatar);
}


static JSValue js_avatar_get_root(JSContext *ctx, JSValueConst this_val) {
  Avatar *avatar = JS_GetOpaque2(ctx, this_val, js_avatar_class_id);

  if (!avatar) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_node_from_ptr(ctx, avatar->root);
    return val;
  }
}




static JSValue js_avatar_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Avatar *avatar = JS_GetOpaque(this_val, js_avatar_class_id);
  websg_dispose_resource(avatar);
  js_free(ctx, avatar);
  return JS_UNDEFINED;
}

static JSClassDef js_avatar_class = {
  "Avatar"
};

static const JSCFunctionListEntry js_avatar_proto_funcs[] = {
  JS_CGETSET_DEF("root", js_avatar_get_root, NULL),
  JS_CFUNC_DEF("dispose", 0, js_avatar_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Avatar", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_avatar_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_avatar_class_id);
  JS_NewClass(rt, js_avatar_class_id, &js_avatar_class);

  JSValue avatar_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, avatar_proto, js_avatar_proto_funcs, countof(js_avatar_proto_funcs));
  
  JSValue avatar_class = JS_NewCFunction2(ctx, js_avatar_constructor, "Avatar", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, avatar_class, avatar_proto);
  JS_SetClassProto(ctx, js_avatar_class_id, avatar_proto);

  return avatar_class;
}

/**
 * WebSG.Avatar related functions
*/

static JSValue js_get_avatar_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Avatar *avatar = websg_get_resource_by_name(ResourceType_Avatar, name);
  JS_FreeCString(ctx, name);
  return create_avatar_from_ptr(ctx, avatar);
}

JSValue create_avatar_from_ptr(JSContext *ctx, Avatar *avatar) {
  if (!avatar) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, avatar);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_avatar_class_id);
    
    JS_SetOpaque(val, avatar);
    set_js_val_from_ptr(ctx, avatar, val);
  }

  return val;
}

void js_define_avatar_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Avatar", js_define_avatar_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAvatarByName",
    JS_NewCFunction(ctx, js_get_avatar_by_name, "getAvatarByName", 1)
  );
}