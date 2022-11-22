
#ifndef __tiles_renderer_h
#define __tiles_renderer_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_tiles_renderer_class_id;

JSValue create_tiles_renderer_from_ptr(JSContext *ctx, TilesRenderer *tiles_renderer);

void js_define_tiles_renderer_api(JSContext *ctx, JSValue *target);

#endif