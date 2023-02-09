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
#include "audio-data.h"
#include "buffer-view.h"

/**
 * WebSG.AudioData
 */

JSClassID js_audio_data_class_id;

static JSValue js_audio_data_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  AudioData *audio_data = js_mallocz(ctx, sizeof(AudioData));

  

  if (websg_create_resource(ResourceType_AudioData, audio_data)) {
    return JS_EXCEPTION;
  }

  return create_audio_data_from_ptr(ctx, audio_data);
}


static JSValue js_audio_data_get_name(JSContext *ctx, JSValueConst this_val) {
  AudioData *audio_data = JS_GetOpaque2(ctx, this_val, js_audio_data_class_id);

  if (!audio_data) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, audio_data->name);
    return val;
  }
}


static JSValue js_audio_data_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioData *audio_data = JS_GetOpaque2(ctx, this_val, js_audio_data_class_id);

  if (!audio_data) {
    return JS_EXCEPTION;
  } else {
    audio_data->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_data_get_buffer_view(JSContext *ctx, JSValueConst this_val) {
  AudioData *audio_data = JS_GetOpaque2(ctx, this_val, js_audio_data_class_id);

  if (!audio_data) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_buffer_view_from_ptr(ctx, audio_data->buffer_view);
    return val;
  }
}


static JSValue js_audio_data_get_mime_type(JSContext *ctx, JSValueConst this_val) {
  AudioData *audio_data = JS_GetOpaque2(ctx, this_val, js_audio_data_class_id);

  if (!audio_data) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, audio_data->mime_type);
    return val;
  }
}


static JSValue js_audio_data_get_uri(JSContext *ctx, JSValueConst this_val) {
  AudioData *audio_data = JS_GetOpaque2(ctx, this_val, js_audio_data_class_id);

  if (!audio_data) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, audio_data->uri);
    return val;
  }
}




static JSValue js_audio_data_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioData *audio_data = JS_GetOpaque(this_val, js_audio_data_class_id);
  websg_dispose_resource(audio_data);
  js_free(ctx, audio_data);
  return JS_UNDEFINED;
}

static JSClassDef js_audio_data_class = {
  "AudioData"
};

static const JSCFunctionListEntry js_audio_data_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_audio_data_get_name, js_audio_data_set_name),
  JS_CGETSET_DEF("bufferView", js_audio_data_get_buffer_view, NULL),
  JS_CGETSET_DEF("mimeType", js_audio_data_get_mime_type, NULL),
  JS_CGETSET_DEF("uri", js_audio_data_get_uri, NULL),
  JS_CFUNC_DEF("dispose", 0, js_audio_data_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "AudioData", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_audio_data_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_audio_data_class_id);
  JS_NewClass(rt, js_audio_data_class_id, &js_audio_data_class);

  JSValue audio_data_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, audio_data_proto, js_audio_data_proto_funcs, countof(js_audio_data_proto_funcs));
  
  JSValue audio_data_class = JS_NewCFunction2(ctx, js_audio_data_constructor, "AudioData", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, audio_data_class, audio_data_proto);
  JS_SetClassProto(ctx, js_audio_data_class_id, audio_data_proto);

  return audio_data_class;
}

/**
 * WebSG.AudioData related functions
*/

static JSValue js_get_audio_data_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  AudioData *audio_data = websg_get_resource_by_name(ResourceType_AudioData, name);
  JS_FreeCString(ctx, name);
  return create_audio_data_from_ptr(ctx, audio_data);
}

JSValue create_audio_data_from_ptr(JSContext *ctx, AudioData *audio_data) {
  if (!audio_data) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, audio_data);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_audio_data_class_id);
    
    JS_SetOpaque(val, audio_data);
    set_js_val_from_ptr(ctx, audio_data, val);
  }

  return val;
}

void js_define_audio_data_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "AudioData", js_define_audio_data_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAudioDataByName",
    JS_NewCFunction(ctx, js_get_audio_data_by_name, "getAudioDataByName", 1)
  );
}