
#ifndef __media_stream_source_h
#define __media_stream_source_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_media_stream_source_class_id;

JSValue create_media_stream_source_from_ptr(JSContext *ctx, MediaStreamSource *media_stream_source);

void js_define_media_stream_source_api(JSContext *ctx, JSValue *target);

#endif