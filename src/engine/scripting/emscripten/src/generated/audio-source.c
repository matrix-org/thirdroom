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
#include "audio-source.h"
#include "audio-data.h"

/**
 * WebSG.AudioSource
 */

JSClassID js_audio_source_class_id;

static JSValue js_audio_source_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  AudioSource *audio_source = js_mallocz(ctx, sizeof(AudioSource));

  

  if (websg_create_resource(ResourceType_AudioSource, audio_source)) {
    return JS_EXCEPTION;
  }

  return create_audio_source_from_ptr(ctx, audio_source);
}


static JSValue js_audio_source_get_name(JSContext *ctx, JSValueConst this_val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, audio_source->name);
    return val;
  }
}


static JSValue js_audio_source_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    audio_source->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_source_get_audio(JSContext *ctx, JSValueConst this_val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_audio_data_from_ptr(ctx, audio_source->audio);
    return val;
  }
}


static JSValue js_audio_source_set_audio(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    audio_source->audio = JS_GetOpaque(val, js_audio_data_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_source_get_gain(JSContext *ctx, JSValueConst this_val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_source->gain);
    return val;
  }
}


static JSValue js_audio_source_set_gain(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_source->gain, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_source_get_auto_play(JSContext *ctx, JSValueConst this_val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, audio_source->auto_play);
    return val;
  }
}


static JSValue js_audio_source_get_loop(JSContext *ctx, JSValueConst this_val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, audio_source->loop);
    return val;
  }
}


static JSValue js_audio_source_set_loop(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioSource *audio_source = JS_GetOpaque2(ctx, this_val, js_audio_source_class_id);

  if (!audio_source) {
    return JS_EXCEPTION;
  } else {
    audio_source->loop = JS_ToBool(ctx, val);
    return JS_UNDEFINED;
  }
}




static JSValue js_audio_source_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioSource *audio_source = JS_GetOpaque(this_val, js_audio_source_class_id);
  websg_dispose_resource(audio_source);
  js_free(ctx, audio_source);
  return JS_UNDEFINED;
}

static JSClassDef js_audio_source_class = {
  "AudioSource"
};

static const JSCFunctionListEntry js_audio_source_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_audio_source_get_name, js_audio_source_set_name),
  JS_CGETSET_DEF("audio", js_audio_source_get_audio, js_audio_source_set_audio),
  JS_CGETSET_DEF("gain", js_audio_source_get_gain, js_audio_source_set_gain),
  JS_CGETSET_DEF("autoPlay", js_audio_source_get_auto_play, NULL),
  JS_CGETSET_DEF("loop", js_audio_source_get_loop, js_audio_source_set_loop),
  JS_CFUNC_DEF("dispose", 0, js_audio_source_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "AudioSource", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_audio_source_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_audio_source_class_id);
  JS_NewClass(rt, js_audio_source_class_id, &js_audio_source_class);

  JSValue audio_source_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, audio_source_proto, js_audio_source_proto_funcs, countof(js_audio_source_proto_funcs));
  
  JSValue audio_source_class = JS_NewCFunction2(ctx, js_audio_source_constructor, "AudioSource", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, audio_source_class, audio_source_proto);
  JS_SetClassProto(ctx, js_audio_source_class_id, audio_source_proto);

  return audio_source_class;
}

/**
 * WebSG.AudioSource related functions
*/

static JSValue js_get_audio_source_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  AudioSource *audio_source = websg_get_resource_by_name(ResourceType_AudioSource, name);
  JS_FreeCString(ctx, name);
  return create_audio_source_from_ptr(ctx, audio_source);
}

JSValue create_audio_source_from_ptr(JSContext *ctx, AudioSource *audio_source) {
  if (!audio_source) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, audio_source);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_audio_source_class_id);
    
    JS_SetOpaque(val, audio_source);
    set_js_val_from_ptr(ctx, audio_source, val);
  }

  return val;
}

void js_define_audio_source_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "AudioSource", js_define_audio_source_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAudioSourceByName",
    JS_NewCFunction(ctx, js_get_audio_source_by_name, "getAudioSourceByName", 1)
  );
}