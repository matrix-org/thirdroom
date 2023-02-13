#include <math.h>
#include <stdint.h>
#include "./quickjs/quickjs.h"
#include "../thirdroom.h"

static JSValue js_enable_matrix_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  thirdroom_enable_matrix_material(JS_ToBool(ctx, argv[0]));
  return JS_UNDEFINED;
}

static JSValue js_get_audio_data_size(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_NewInt32(ctx, thirdroom_get_audio_data_size());
}

uint8_t *js_get_audio_typed_array_data(JSContext *ctx, JSValueConst obj) {
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

static JSValue js_get_audio_time_data(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint8_t *data = js_get_audio_typed_array_data(ctx, argv[0]);
  int32_t bytes_written = thirdroom_get_audio_time_data(data);
  return JS_NewInt32(ctx, bytes_written);
}

static JSValue js_get_audio_frequency_data(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint8_t *data = js_get_audio_typed_array_data(ctx, argv[0]);
  int32_t bytes_written = thirdroom_get_audio_frequency_data(data);
  return JS_NewInt32(ctx, bytes_written);
}

void js_define_thirdroom_api(JSContext *ctx, JSValue *target) {
  JSValue thirdroom = JS_NewObject(ctx);
  
  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "enableMatrixMaterial",
    JS_NewCFunction(ctx, js_enable_matrix_material, "enableMatrixMaterial", 1)
  );

  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "getAudioDataSize",
    JS_NewCFunction(ctx, js_get_audio_data_size, "getAudioDataSize", 0)
  );
  
  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "getAudioTimeData",
    JS_NewCFunction(ctx, js_get_audio_time_data, "getAudioTimeData", 1)
  );

  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "getAudioFrequencyData",
    JS_NewCFunction(ctx, js_get_audio_frequency_data, "getAudioFrequencyData", 1)
  );

  JS_SetPropertyStr(ctx, *target, "ThirdRoom", thirdroom);
}