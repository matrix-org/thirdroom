#include <string.h>

#include "thirdroom.h"
#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

static JSValue js_enable_matrix_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  thirdroom_enable_matrix_material(JS_ToBool(ctx, argv[0]));
  return JS_UNDEFINED;
}

void js_define_thirdroom_api(JSContext *ctx, JSValue *target) {
  JSValue thirdroom = JS_NewObject(ctx);
  JS_SetPropertyStr(
    ctx,
    thirdroom,
    "enableMatrixMaterial",
    JS_NewCFunction(ctx, js_enable_matrix_material, "enableMatrixMaterial", 1)
  );
  JS_SetPropertyStr(ctx, *target, "thirdroom", thirdroom);
}