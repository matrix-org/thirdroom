#include <math.h>
#include <stdint.h>
#include "../quickjs/quickjs.h"
#include "../quickjs/cutils.h"
#include "../../thirdroom.h"
#include "./thirdroom-js.h"
#include "./action-bar.h"
#include "./action-bar-listener.h"
#include "./action-bar-iterator.h"

JSClassID js_thirdroom_class_id;

static JSClassDef js_thirdroom_class = {
  "ThirdRoom"
};

static JSValue js_thirdroom_enable_matrix_material(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  thirdroom_enable_matrix_material(JS_ToBool(ctx, argv[0]));
  return JS_UNDEFINED;
}

static JSValue js_thirdroom_get_audio_data_size(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_NewInt32(ctx, thirdroom_get_audio_data_size());
}

uint8_t *js_thirdroom_get_audio_typed_array_data(JSContext *ctx, JSValueConst obj) {
  int audio_data_byte_length = thirdroom_get_audio_data_size();

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  // TODO: Check for a Uint8Array not just a TypedArray
  JSValue buffer = JS_GetTypedArrayBuffer(ctx, obj, &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return NULL;
  }

  if (view_byte_length < audio_data_byte_length) {
    JS_ThrowRangeError(ctx, "invalid typed array length");
    return NULL;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  return data;
}

static JSValue js_thirdroom_get_audio_time_data(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint8_t *data = js_thirdroom_get_audio_typed_array_data(ctx, argv[0]);
  int32_t bytes_written = thirdroom_get_audio_time_data(data);
  return JS_NewInt32(ctx, bytes_written);
}

static JSValue js_thirdroom_get_audio_frequency_data(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint8_t *data = js_thirdroom_get_audio_typed_array_data(ctx, argv[0]);
  int32_t bytes_written = thirdroom_get_audio_frequency_data(data);
  return JS_NewInt32(ctx, bytes_written);
}

static JSValue js_thirdroom_in_ar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_NewBool(ctx, thirdroom_in_ar());
}

static const JSCFunctionListEntry js_thirdroom_funcs[] = {
  JS_CFUNC_DEF("enableMatrixMaterial", 1, js_thirdroom_enable_matrix_material),
  JS_CFUNC_DEF("getAudioDataSize", 0, js_thirdroom_get_audio_data_size),
  JS_CFUNC_DEF("getAudioTimeData", 1, js_thirdroom_get_audio_time_data),
  JS_CFUNC_DEF("getAudioFrequencyData", 1, js_thirdroom_get_audio_frequency_data),
  JS_CFUNC_DEF("inAR", 0, js_thirdroom_in_ar),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ThirdRoom", JS_PROP_CONFIGURABLE),
};

static JSValue js_thirdroom_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_define_thirdroom_api(JSContext *ctx) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue thirdroom_namespace = JS_NewObject(ctx);
  JS_SetPropertyStr(
    ctx,
    global,
    "ThirdRoom",
    thirdroom_namespace
  );

  JS_NewClassID(&js_thirdroom_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_thirdroom_class_id, &js_thirdroom_class);
  JSValue thirdroom_class = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, thirdroom_class, js_thirdroom_funcs, countof(js_thirdroom_funcs));
  JS_SetClassProto(ctx, js_thirdroom_class_id, thirdroom_class);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_thirdroom_constructor,
    "ThirdRoom",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, thirdroom_class);
  JS_SetPropertyStr(
    ctx,
    thirdroom_namespace,
    "ThirdRoom",
    constructor
  );

  JSValue thirdroom = JS_NewObjectClass(ctx, js_thirdroom_class_id);

  js_thirdroom_define_action_bar(ctx, thirdroom_namespace);
  js_thirdroom_define_action_bar_listener(ctx, thirdroom_namespace);
  js_thirdroom_define_action_bar_iterator(ctx);

  JS_SetPropertyStr(ctx, thirdroom, "actionBar", js_thirdroom_new_action_bar(ctx));

  JS_SetPropertyStr(ctx, global, "thirdroom", thirdroom);
}