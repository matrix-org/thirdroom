#include "../quickjs/quickjs.h"
#include "./console.h"

void js_define_global_api(JSContext *ctx) {
  JSValue global = JS_GetGlobalObject(ctx);
  js_define_console_api(ctx, global);
}