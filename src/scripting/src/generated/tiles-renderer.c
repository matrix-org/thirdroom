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
#include "tiles-renderer.h"

/**
 * WebSG.TilesRenderer
 */

JSClassID js_tiles_renderer_class_id;

static JSValue js_tiles_renderer_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  TilesRenderer *tiles_renderer = js_mallocz(ctx, sizeof(TilesRenderer));

  

  if (websg_create_resource(ResourceType_TilesRenderer, tiles_renderer)) {
    return JS_EXCEPTION;
  }

  return create_tiles_renderer_from_ptr(ctx, tiles_renderer);
}


static JSValue js_tiles_renderer_get_uri(JSContext *ctx, JSValueConst this_val) {
  TilesRenderer *tiles_renderer = JS_GetOpaque2(ctx, this_val, js_tiles_renderer_class_id);

  if (!tiles_renderer) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, tiles_renderer->uri);
    return val;
  }
}




static JSValue js_tiles_renderer_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  TilesRenderer *tiles_renderer = JS_GetOpaque(this_val, js_tiles_renderer_class_id);
  websg_dispose_resource(tiles_renderer);
  js_free(ctx, tiles_renderer);
  return JS_UNDEFINED;
}

static JSClassDef js_tiles_renderer_class = {
  "TilesRenderer"
};

static const JSCFunctionListEntry js_tiles_renderer_proto_funcs[] = {
  JS_CGETSET_DEF("uri", js_tiles_renderer_get_uri, NULL),
  JS_CFUNC_DEF("dispose", 0, js_tiles_renderer_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "TilesRenderer", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_tiles_renderer_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_tiles_renderer_class_id);
  JS_NewClass(rt, js_tiles_renderer_class_id, &js_tiles_renderer_class);

  JSValue tiles_renderer_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, tiles_renderer_proto, js_tiles_renderer_proto_funcs, countof(js_tiles_renderer_proto_funcs));
  
  JSValue tiles_renderer_class = JS_NewCFunction2(ctx, js_tiles_renderer_constructor, "TilesRenderer", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, tiles_renderer_class, tiles_renderer_proto);
  JS_SetClassProto(ctx, js_tiles_renderer_class_id, tiles_renderer_proto);

  return tiles_renderer_class;
}

/**
 * WebSG.TilesRenderer related functions
*/

static JSValue js_get_tiles_renderer_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  TilesRenderer *tiles_renderer = websg_get_resource_by_name(ResourceType_TilesRenderer, name);
  JS_FreeCString(ctx, name);
  return create_tiles_renderer_from_ptr(ctx, tiles_renderer);
}

JSValue create_tiles_renderer_from_ptr(JSContext *ctx, TilesRenderer *tiles_renderer) {
  if (!tiles_renderer) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, tiles_renderer);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_tiles_renderer_class_id);
    
    JS_SetOpaque(val, tiles_renderer);
    set_js_val_from_ptr(ctx, tiles_renderer, val);
  }

  return val;
}

void js_define_tiles_renderer_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "TilesRenderer", js_define_tiles_renderer_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getTilesRendererByName",
    JS_NewCFunction(ctx, js_get_tiles_renderer_by_name, "getTilesRendererByName", 1)
  );
}