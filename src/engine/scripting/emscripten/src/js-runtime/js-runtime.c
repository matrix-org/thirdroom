#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"

#include "../websg.h"
#include "../thirdroom.h"

#include "./console-js.h"
#include "./matrix-js.h"
#include "./thirdroom-js.h"
#include "./websg-js.h"

/**
 * Global State
 **/

JSRuntime *rt;
JSContext *ctx;

/**
 * Web Scene Graph (WebSG) Implementation
 **/

JSAtom onUpdateAtom;
JSAtom onLoadAtom;
JSAtom onEnterAtom;

/*********************
 * Exported Functions
 *********************/

export int32_t websg_initialize() {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);

  onUpdateAtom = JS_NewAtom(ctx, "onupdate");
  onLoadAtom = JS_NewAtom(ctx, "onload");
  onEnterAtom = JS_NewAtom(ctx, "onenter");

  JSValue global = JS_GetGlobalObject(ctx);
  js_define_console_api(ctx, &global);
  js_define_websg_api(ctx, &global);
  js_define_thirdroom_api(ctx, &global);
  js_define_matrix_api(ctx, &global);

  int32_t source_len = thirdroom_get_js_source_size();
  char *source = js_malloc(ctx, source_len); // TODO: can we free this after JS_Eval?
  int32_t read_source_len = thirdroom_get_js_source(source);

  JSValue result = JS_Eval(ctx, source, read_source_len, "<environment-script>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(result)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);

    return -1;
  }

  return 0;
}

export int32_t websg_load() {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue loadFn = JS_GetProperty(ctx, global, onLoadAtom);

  if (JS_IsException(loadFn)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    JS_FreeValue(ctx, loadFn);
    return -1;
  } else if (JS_IsUndefined(loadFn)) {
    return 0;
  }

  JSValueConst args[] = {};
  JSValue val = JS_Call(ctx, loadFn, JS_UNDEFINED, 0, args);
  JS_FreeValue(ctx, loadFn);

  int32_t ret = 0;

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    ret = -1;
  }

  JS_FreeValue(ctx, val);

  return ret;
}

export int32_t websg_enter() {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue enterFn = JS_GetProperty(ctx, global, onEnterAtom);

  if (JS_IsException(enterFn)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    JS_FreeValue(ctx, enterFn);
    return -1;
  } else if (JS_IsUndefined(enterFn)) {
    return 0;
  }

  JSValueConst args[] = {};
  JSValue val = JS_Call(ctx, enterFn, JS_UNDEFINED, 0, args);
  JS_FreeValue(ctx, enterFn);

  int32_t ret = 0;

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    ret = -1;
  }

  JS_FreeValue(ctx, val);

  return ret;
}

export int32_t websg_update(float_t dt) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue updateFn = JS_GetProperty(ctx, global, onUpdateAtom);

  if (JS_IsException(updateFn)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    JS_FreeValue(ctx, updateFn);
    return -1;
  } else if (JS_IsUndefined(updateFn)) {
    return 0;
  }

  JSValue dtVal = JS_NewFloat64(ctx, dt);

  if (JS_IsException(dtVal)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    JS_FreeValue(ctx, dtVal);
    return -1;
  }

  JSValueConst args[] = { dtVal };
  JSValue val = JS_Call(ctx, updateFn, JS_UNDEFINED, 1, args);

  JS_FreeValue(ctx, updateFn);

  int32_t ret = 0;

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    ret = -1;
  }

  JS_FreeValue(ctx, val);

  return ret;
}

#ifdef THIRDROOM_TEST

export void *test_alloc(int size) {
  return js_mallocz_rt(rt, size);
}

export const char *test_eval_js(const char * code) {
  JSValue result = JS_Eval(ctx, code, strlen(code), "<module>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(result)) {
    JSValue error = JS_GetException(ctx);
    JS_FreeValue(ctx, result);
    JSValue error_obj = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, error_obj, "error", JS_GetPropertyStr(ctx, error, "message"));
    JS_SetPropertyStr(ctx, error_obj, "stack", JS_GetPropertyStr(ctx, error, "stack"));
    result = error_obj;
  }

  JSValue result_str_value = JS_JSONStringify(ctx, result, JS_UNDEFINED, JS_UNDEFINED);

  if (JS_IsUndefined(result_str_value)) {
    return NULL;
  }

  const char *result_str_ptr = JS_ToCString(ctx, result_str_value);

  JS_FreeValue(ctx, result);

  return result_str_ptr;
}

#endif