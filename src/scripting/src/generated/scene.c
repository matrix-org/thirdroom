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
#include "scene.h"
#include "texture.h"
#include "reflection-probe.h"
#include "audio-emitter.h"
#include "node.h"

/**
 * WebSG.Scene
 */

JSClassID js_scene_class_id;

static JSValue js_scene_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Scene *scene = js_mallocz(ctx, sizeof(Scene));

  

  if (websg_create_resource(ResourceType_Scene, scene)) {
    return JS_EXCEPTION;
  }

  return create_scene_from_ptr(ctx, scene);
}


static JSValue js_scene_get_name(JSContext *ctx, JSValueConst this_val) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, scene->name);
    return val;
  }
}


static JSValue js_scene_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    scene->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_scene_get_background_texture(JSContext *ctx, JSValueConst this_val) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, scene->background_texture);
    return val;
  }
}


static JSValue js_scene_set_background_texture(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    scene->background_texture = JS_GetOpaque(val, js_texture_class_id);
    return JS_UNDEFINED;
  }
}


static JSValue js_scene_get_reflection_probe(JSContext *ctx, JSValueConst this_val) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_reflection_probe_from_ptr(ctx, scene->reflection_probe);
    return val;
  }
}


static JSValue js_scene_set_reflection_probe(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    scene->reflection_probe = JS_GetOpaque(val, js_reflection_probe_class_id);
    return JS_UNDEFINED;
  }
}

static JSValue js_scene_audio_emitters(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefArrayIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_audio_emitter_from_ptr, (void **)scene->audio_emitters, countof(scene->audio_emitters));
  }
}

static JSValue js_scene_add_audio_emitter(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    return JS_AddRefArrayItem(ctx, js_audio_emitter_class_id, (void **)scene->audio_emitters, countof(scene->audio_emitters), argv[0]);
  }
}

static JSValue js_scene_remove_audio_emitter(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

  if (!scene) {
    return JS_EXCEPTION;
  } else {
    return JS_RemoveRefArrayItem(ctx, js_audio_emitter_class_id, (void **)scene->audio_emitters, countof(scene->audio_emitters), argv[0]);
  }
}



static JSValue js_scene_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Scene *scene = JS_GetOpaque(this_val, js_scene_class_id);
  websg_dispose_resource(scene);
  js_free(ctx, scene);
  return JS_UNDEFINED;
}

static JSClassDef js_scene_class = {
  "Scene"
};

static const JSCFunctionListEntry js_scene_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_scene_get_name, js_scene_set_name),
  JS_CGETSET_DEF("backgroundTexture", js_scene_get_background_texture, js_scene_set_background_texture),
  JS_CGETSET_DEF("reflectionProbe", js_scene_get_reflection_probe, js_scene_set_reflection_probe),
  JS_CFUNC_DEF("audioEmitters", 0, js_scene_audio_emitters),
  JS_CFUNC_DEF("addAudioEmitter", 1, js_scene_add_audio_emitter),
  JS_CFUNC_DEF("removeAudioEmitter", 1, js_scene_remove_audio_emitter),
  JS_CFUNC_DEF("dispose", 0, js_scene_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Scene", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_scene_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_scene_class_id);
  JS_NewClass(rt, js_scene_class_id, &js_scene_class);

  JSValue scene_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, scene_proto, js_scene_proto_funcs, countof(js_scene_proto_funcs));
  
  JSValue scene_class = JS_NewCFunction2(ctx, js_scene_constructor, "Scene", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, scene_class, scene_proto);
  JS_SetClassProto(ctx, js_scene_class_id, scene_proto);

  return scene_class;
}

/**
 * WebSG.Scene related functions
*/

static JSValue js_get_scene_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Scene *scene = websg_get_resource_by_name(ResourceType_Scene, name);
  JS_FreeCString(ctx, name);
  return create_scene_from_ptr(ctx, scene);
}

JSValue create_scene_from_ptr(JSContext *ctx, Scene *scene) {
  if (!scene) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, scene);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_scene_class_id);
    
    JS_SetOpaque(val, scene);
    set_js_val_from_ptr(ctx, scene, val);
  }

  return val;
}

void js_define_scene_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Scene", js_define_scene_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getSceneByName",
    JS_NewCFunction(ctx, js_get_scene_by_name, "getSceneByName", 1)
  );
}