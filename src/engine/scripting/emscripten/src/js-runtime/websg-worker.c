#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "./utils/exception.h"

#include "../websg.h"
#include "../thirdroom.h"

#include "./global/global-js.h"
#include "./matrix/matrix-js.h"
#include "./thirdroom/thirdroom-js.h"
#include "./websg/websg-js.h"
#include "./websg-network/websg-network-js.h"

/**
 * Global State
 **/

JSRuntime *rt;
JSContext *ctx;

/**
 * Web Scene Graph (WebSG) Implementation
 **/

JSAtom on_update_world_atom;
JSAtom on_load_world_atom;
JSAtom on_enter_world_atom;

/*********************
 * Exported Functions
 *********************/

export int32_t websg_initialize() {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);

  js_define_global_api(ctx);
  js_define_thirdroom_api(ctx);
  js_define_matrix_api(ctx);
  js_define_websg_api(ctx);
  js_define_websg_network_api(ctx);

  on_load_world_atom = JS_NewAtom(ctx, "onloadworld");
  on_enter_world_atom = JS_NewAtom(ctx, "onenterworld");
  on_update_world_atom = JS_NewAtom(ctx, "onupdateworld");

  int32_t source_len = thirdroom_get_js_source_size();
  char *source = js_mallocz(ctx, source_len); // TODO: can we free this after JS_Eval?
  int32_t read_source_len = thirdroom_get_js_source(source);

  JSValue val = JS_Eval(ctx, source, read_source_len, "<environment-script>", JS_EVAL_TYPE_GLOBAL);

  if (js_handle_exception(ctx, val) < 0) {
    return -1;
  } else {
    JS_FreeValue(ctx, val);
    return 0;
  }
}

export int32_t websg_load() {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue on_load_world_func = JS_GetProperty(ctx, global, on_load_world_atom);

  if (js_handle_exception(ctx, on_load_world_func)) {
    return -1;
  } else if (JS_IsUndefined(on_load_world_func)) {
    return 0;
  }

  JSValueConst args[] = {};
  JSValue val = JS_Call(ctx, on_load_world_func, JS_UNDEFINED, 0, args);
  JS_FreeValue(ctx, on_load_world_func);

  if (js_handle_exception(ctx, val) < 0) {
    return -1;
  } else {
    JS_FreeValue(ctx, val);
    return 0;
  }
}

export int32_t websg_enter() {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue on_enter_world_func = JS_GetProperty(ctx, global, on_enter_world_atom);

  if (js_handle_exception(ctx, on_enter_world_func) < 0) {
    return -1;
  } else if (JS_IsUndefined(on_enter_world_func)) {
    return 0;
  }

  JSValueConst args[] = {};
  JSValue val = JS_Call(ctx, on_enter_world_func, JS_UNDEFINED, 0, args);
  JS_FreeValue(ctx, on_enter_world_func);

  if (js_handle_exception(ctx, val) < 0) {
    return -1;
  } else {
    JS_FreeValue(ctx, val);
    return 0;
  }
}

export int32_t websg_update(float_t dt, float_t time) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue on_update_world_func = JS_GetProperty(ctx, global, on_update_world_atom);

  if (js_handle_exception(ctx, on_update_world_func) < 0) {
    return -1;
  } else if (JS_IsUndefined(on_update_world_func)) {
    return 0;
  }

  JSValue dt_val = JS_NewFloat64(ctx, dt);

  if (js_handle_exception(ctx, dt_val) < 0) {
    return -1;
  }

  JSValue time_val = JS_NewFloat64(ctx, time);

  if (js_handle_exception(ctx, time_val) < 0) {
    return -1;
  }

  JSValueConst args[] = { dt_val, time_val };
  JSValue val = JS_Call(ctx, on_update_world_func, JS_UNDEFINED, 2, args);
  JS_FreeValue(ctx, on_update_world_func);

  if (js_handle_exception(ctx, val) < 0) {
    return -1;
  } else {
    JS_FreeValue(ctx, val);
    return 0;
  }
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