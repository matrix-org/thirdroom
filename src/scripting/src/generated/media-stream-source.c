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
#include "media-stream-source.h"

/**
 * WebSG.MediaStreamSource
 */

JSClassID js_media_stream_source_class_id;

static JSValue js_media_stream_source_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  MediaStreamSource *media_stream_source = js_mallocz(ctx, sizeof(MediaStreamSource));

  

  if (websg_create_resource(ResourceType_MediaStreamSource, media_stream_source)) {
    return JS_EXCEPTION;
  }

  return create_media_stream_source_from_ptr(ctx, media_stream_source);
}


static JSValue js_media_stream_source_get_name(JSContext *ctx, JSValueConst this_val) {
  MediaStreamSource *media_stream_source = JS_GetOpaque2(ctx, this_val, js_media_stream_source_class_id);

  if (!media_stream_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, media_stream_source->name);
    return val;
  }
}


static JSValue js_media_stream_source_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  MediaStreamSource *media_stream_source = JS_GetOpaque2(ctx, this_val, js_media_stream_source_class_id);

  if (!media_stream_source) {
    return JS_EXCEPTION;
  } else {
    media_stream_source->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_media_stream_source_get_stream(JSContext *ctx, JSValueConst this_val) {
  MediaStreamSource *media_stream_source = JS_GetOpaque2(ctx, this_val, js_media_stream_source_class_id);

  if (!media_stream_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, media_stream_source->stream);
    return val;
  }
}


static JSValue js_media_stream_source_set_stream(JSContext *ctx, JSValueConst this_val, JSValue val) {
  MediaStreamSource *media_stream_source = JS_GetOpaque2(ctx, this_val, js_media_stream_source_class_id);

  if (!media_stream_source) {
    return JS_EXCEPTION;
  } else {
    media_stream_source->stream = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_media_stream_source_get_gain(JSContext *ctx, JSValueConst this_val) {
  MediaStreamSource *media_stream_source = JS_GetOpaque2(ctx, this_val, js_media_stream_source_class_id);

  if (!media_stream_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)media_stream_source->gain);
    return val;
  }
}


static JSValue js_media_stream_source_set_gain(JSContext *ctx, JSValueConst this_val, JSValue val) {
  MediaStreamSource *media_stream_source = JS_GetOpaque2(ctx, this_val, js_media_stream_source_class_id);

  if (!media_stream_source) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &media_stream_source->gain, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}




static JSValue js_media_stream_source_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  MediaStreamSource *media_stream_source = JS_GetOpaque(this_val, js_media_stream_source_class_id);
  websg_dispose_resource(media_stream_source);
  js_free(ctx, media_stream_source);
  return JS_UNDEFINED;
}

static JSClassDef js_media_stream_source_class = {
  "MediaStreamSource"
};

static const JSCFunctionListEntry js_media_stream_source_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_media_stream_source_get_name, js_media_stream_source_set_name),
  JS_CGETSET_DEF("stream", js_media_stream_source_get_stream, js_media_stream_source_set_stream),
  JS_CGETSET_DEF("gain", js_media_stream_source_get_gain, js_media_stream_source_set_gain),
  JS_CFUNC_DEF("dispose", 0, js_media_stream_source_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "MediaStreamSource", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_media_stream_source_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_media_stream_source_class_id);
  JS_NewClass(rt, js_media_stream_source_class_id, &js_media_stream_source_class);

  JSValue media_stream_source_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, media_stream_source_proto, js_media_stream_source_proto_funcs, countof(js_media_stream_source_proto_funcs));
  
  JSValue media_stream_source_class = JS_NewCFunction2(ctx, js_media_stream_source_constructor, "MediaStreamSource", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, media_stream_source_class, media_stream_source_proto);
  JS_SetClassProto(ctx, js_media_stream_source_class_id, media_stream_source_proto);

  return media_stream_source_class;
}

/**
 * WebSG.MediaStreamSource related functions
*/

static JSValue js_get_media_stream_source_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  MediaStreamSource *media_stream_source = websg_get_resource_by_name(ResourceType_MediaStreamSource, name);
  JS_FreeCString(ctx, name);
  return create_media_stream_source_from_ptr(ctx, media_stream_source);
}

JSValue create_media_stream_source_from_ptr(JSContext *ctx, MediaStreamSource *media_stream_source) {
  if (!media_stream_source) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, media_stream_source);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_media_stream_source_class_id);
    
    JS_SetOpaque(val, media_stream_source);
    set_js_val_from_ptr(ctx, media_stream_source, val);
  }

  return val;
}

void js_define_media_stream_source_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "MediaStreamSource", js_define_media_stream_source_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getMediaStreamSourceByName",
    JS_NewCFunction(ctx, js_get_media_stream_source_by_name, "getMediaStreamSourceByName", 1)
  );
}