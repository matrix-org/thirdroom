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
#include "audio-analyser.h"

/**
 * WebSG.AudioAnalyser
 */

JSClassID js_audio_analyser_class_id;

static JSValue js_audio_analyser_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  AudioAnalyser *audio_analyser = js_mallocz(ctx, sizeof(AudioAnalyser));

  

  if (websg_create_resource(ResourceType_AudioAnalyser, audio_analyser)) {
    return JS_EXCEPTION;
  }

  return create_audio_analyser_from_ptr(ctx, audio_analyser);
}


static JSValue js_audio_analyser_get_name(JSContext *ctx, JSValueConst this_val) {
  AudioAnalyser *audio_analyser = JS_GetOpaque2(ctx, this_val, js_audio_analyser_class_id);

  if (!audio_analyser) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, audio_analyser->name);
    return val;
  }
}


static JSValue js_audio_analyser_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioAnalyser *audio_analyser = JS_GetOpaque2(ctx, this_val, js_audio_analyser_class_id);

  if (!audio_analyser) {
    return JS_EXCEPTION;
  } else {
    audio_analyser->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}




static JSValue js_audio_analyser_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioAnalyser *audio_analyser = JS_GetOpaque(this_val, js_audio_analyser_class_id);
  websg_dispose_resource(audio_analyser);
  js_free(ctx, audio_analyser);
  return JS_UNDEFINED;
}

static JSClassDef js_audio_analyser_class = {
  "AudioAnalyser"
};

static const JSCFunctionListEntry js_audio_analyser_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_audio_analyser_get_name, js_audio_analyser_set_name),
  JS_CFUNC_DEF("dispose", 0, js_audio_analyser_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "AudioAnalyser", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_audio_analyser_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_audio_analyser_class_id);
  JS_NewClass(rt, js_audio_analyser_class_id, &js_audio_analyser_class);

  JSValue audio_analyser_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, audio_analyser_proto, js_audio_analyser_proto_funcs, countof(js_audio_analyser_proto_funcs));
  
  JSValue audio_analyser_class = JS_NewCFunction2(ctx, js_audio_analyser_constructor, "AudioAnalyser", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, audio_analyser_class, audio_analyser_proto);
  JS_SetClassProto(ctx, js_audio_analyser_class_id, audio_analyser_proto);

  return audio_analyser_class;
}

/**
 * WebSG.AudioAnalyser related functions
*/

static JSValue js_get_audio_analyser_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  AudioAnalyser *audio_analyser = websg_get_resource_by_name(ResourceType_AudioAnalyser, name);
  JS_FreeCString(ctx, name);
  return create_audio_analyser_from_ptr(ctx, audio_analyser);
}

JSValue create_audio_analyser_from_ptr(JSContext *ctx, AudioAnalyser *audio_analyser) {
  if (!audio_analyser) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, audio_analyser);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_audio_analyser_class_id);
    JS_DefineReadOnlyArrayBufferProperty(ctx, val, "frequencyData", audio_analyser->frequency_data);
JS_DefineReadOnlyArrayBufferProperty(ctx, val, "timeData", audio_analyser->time_data);
    JS_SetOpaque(val, audio_analyser);
    set_js_val_from_ptr(ctx, audio_analyser, val);
  }

  return val;
}

void js_define_audio_analyser_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "AudioAnalyser", js_define_audio_analyser_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAudioAnalyserByName",
    JS_NewCFunction(ctx, js_get_audio_analyser_by_name, "getAudioAnalyserByName", 1)
  );
}