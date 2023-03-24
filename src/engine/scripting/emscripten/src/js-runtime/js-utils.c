#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "./js-utils.h"
#include "../websg.h"

void *get_typed_array_data(JSContext *ctx, JSValue *value, size_t byte_length) {
  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, *value, &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return NULL;
  }

  if (view_byte_length != byte_length) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return NULL;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  return (void *)data;
}

void init_websg_context(JSContext *ctx) {
  WebSGContext *websg = js_malloc(ctx, sizeof(WebSGContext));
  websg->scenes = JS_NewObject(ctx);
  websg->nodes = JS_NewObject(ctx);
  websg->meshes = JS_NewObject(ctx);
  websg->lights = JS_NewObject(ctx);
  JS_SetContextOpaque(ctx, websg);
}
