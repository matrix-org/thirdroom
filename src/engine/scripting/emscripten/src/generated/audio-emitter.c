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
#include "audio-emitter.h"
#include "audio-source.h"

/**
 * WebSG.AudioEmitter
 */

JSClassID js_audio_emitter_class_id;

static JSValue js_audio_emitter_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  AudioEmitter *audio_emitter = js_mallocz(ctx, sizeof(AudioEmitter));

  

  if (websg_create_resource(ResourceType_AudioEmitter, audio_emitter)) {
    return JS_EXCEPTION;
  }

  return create_audio_emitter_from_ptr(ctx, audio_emitter);
}


static JSValue js_audio_emitter_get_name(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, audio_emitter->name);
    return val;
  }
}


static JSValue js_audio_emitter_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    audio_emitter->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_type(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, audio_emitter->type);
    return val;
  }
}


static JSValue js_audio_emitter_set_type(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &audio_emitter->type, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}

static JSValue js_audio_emitter_sources(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefArrayIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_audio_source_from_ptr, (void **)audio_emitter->sources, countof(audio_emitter->sources));
  }
}

static JSValue js_audio_emitter_add_source(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    return JS_AddRefArrayItem(ctx, js_audio_source_class_id, (void **)audio_emitter->sources, countof(audio_emitter->sources), argv[0]);
  }
}

static JSValue js_audio_emitter_remove_source(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    return JS_RemoveRefArrayItem(ctx, js_audio_source_class_id, (void **)audio_emitter->sources, countof(audio_emitter->sources), argv[0]);
  }
}

static JSValue js_audio_emitter_get_gain(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_emitter->gain);
    return val;
  }
}


static JSValue js_audio_emitter_set_gain(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_emitter->gain, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_cone_inner_angle(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_emitter->cone_inner_angle);
    return val;
  }
}


static JSValue js_audio_emitter_set_cone_inner_angle(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_emitter->cone_inner_angle, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_cone_outer_angle(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_emitter->cone_outer_angle);
    return val;
  }
}


static JSValue js_audio_emitter_set_cone_outer_angle(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_emitter->cone_outer_angle, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_distance_model(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, audio_emitter->distance_model);
    return val;
  }
}


static JSValue js_audio_emitter_set_distance_model(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToUint32(ctx, &audio_emitter->distance_model, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_max_distance(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_emitter->max_distance);
    return val;
  }
}


static JSValue js_audio_emitter_set_max_distance(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_emitter->max_distance, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_ref_distance(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_emitter->ref_distance);
    return val;
  }
}


static JSValue js_audio_emitter_set_ref_distance(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_emitter->ref_distance, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}


static JSValue js_audio_emitter_get_rolloff_factor(JSContext *ctx, JSValueConst this_val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewFloat64(ctx, (double)audio_emitter->rolloff_factor);
    return val;
  }
}


static JSValue js_audio_emitter_set_rolloff_factor(JSContext *ctx, JSValueConst this_val, JSValue val) {
  AudioEmitter *audio_emitter = JS_GetOpaque2(ctx, this_val, js_audio_emitter_class_id);

  if (!audio_emitter) {
    return JS_EXCEPTION;
  } else {
    if (JS_ToFloat32(ctx, &audio_emitter->rolloff_factor, val)) return JS_EXCEPTION;
    return JS_UNDEFINED;
  }
}




static JSValue js_audio_emitter_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AudioEmitter *audio_emitter = JS_GetOpaque(this_val, js_audio_emitter_class_id);
  websg_dispose_resource(audio_emitter);
  js_free(ctx, audio_emitter);
  return JS_UNDEFINED;
}

static JSClassDef js_audio_emitter_class = {
  "AudioEmitter"
};

static const JSCFunctionListEntry js_audio_emitter_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_audio_emitter_get_name, js_audio_emitter_set_name),
  JS_CGETSET_DEF("type", js_audio_emitter_get_type, js_audio_emitter_set_type),
  JS_CFUNC_DEF("sources", 0, js_audio_emitter_sources),
  JS_CFUNC_DEF("addSource", 1, js_audio_emitter_add_source),
  JS_CFUNC_DEF("removeSource", 1, js_audio_emitter_remove_source),
  JS_CGETSET_DEF("gain", js_audio_emitter_get_gain, js_audio_emitter_set_gain),
  JS_CGETSET_DEF("coneInnerAngle", js_audio_emitter_get_cone_inner_angle, js_audio_emitter_set_cone_inner_angle),
  JS_CGETSET_DEF("coneOuterAngle", js_audio_emitter_get_cone_outer_angle, js_audio_emitter_set_cone_outer_angle),
  JS_CGETSET_DEF("distanceModel", js_audio_emitter_get_distance_model, js_audio_emitter_set_distance_model),
  JS_CGETSET_DEF("maxDistance", js_audio_emitter_get_max_distance, js_audio_emitter_set_max_distance),
  JS_CGETSET_DEF("refDistance", js_audio_emitter_get_ref_distance, js_audio_emitter_set_ref_distance),
  JS_CGETSET_DEF("rolloffFactor", js_audio_emitter_get_rolloff_factor, js_audio_emitter_set_rolloff_factor),
  JS_CFUNC_DEF("dispose", 0, js_audio_emitter_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "AudioEmitter", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_audio_emitter_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_audio_emitter_class_id);
  JS_NewClass(rt, js_audio_emitter_class_id, &js_audio_emitter_class);

  JSValue audio_emitter_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, audio_emitter_proto, js_audio_emitter_proto_funcs, countof(js_audio_emitter_proto_funcs));
  
  JSValue audio_emitter_class = JS_NewCFunction2(ctx, js_audio_emitter_constructor, "AudioEmitter", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, audio_emitter_class, audio_emitter_proto);
  JS_SetClassProto(ctx, js_audio_emitter_class_id, audio_emitter_proto);

  return audio_emitter_class;
}

/**
 * WebSG.AudioEmitter related functions
*/

static JSValue js_get_audio_emitter_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  AudioEmitter *audio_emitter = websg_get_resource_by_name(ResourceType_AudioEmitter, name);
  JS_FreeCString(ctx, name);
  return create_audio_emitter_from_ptr(ctx, audio_emitter);
}

JSValue create_audio_emitter_from_ptr(JSContext *ctx, AudioEmitter *audio_emitter) {
  if (!audio_emitter) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, audio_emitter);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_audio_emitter_class_id);
    
    JS_SetOpaque(val, audio_emitter);
    set_js_val_from_ptr(ctx, audio_emitter, val);
  }

  return val;
}

void js_define_audio_emitter_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "AudioEmitter", js_define_audio_emitter_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAudioEmitterByName",
    JS_NewCFunction(ctx, js_get_audio_emitter_by_name, "getAudioEmitterByName", 1)
  );
}