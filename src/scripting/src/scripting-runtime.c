#include <emscripten.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

EMSCRIPTEN_KEEPALIVE
int32_t runJS() {
  JSRuntime *rt;
  rt = JS_NewRuntime();

  JSContext *ctx;
  ctx = JS_NewContext(rt);

  int32_t ret;
  JSValue val;

  const char* buf = "1 + 1";

  val = JS_Eval(ctx, buf, strlen(buf), "<evalScript>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(val)) {
    ret = -1;
  } else {
    JS_ToInt32(ctx, &ret, val);
  }

  JS_FreeValue(ctx, val);

  return ret;
}