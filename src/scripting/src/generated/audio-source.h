
#ifndef __audio_source_h
#define __audio_source_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_audio_source_class_id;

JSValue create_audio_source_from_ptr(JSContext *ctx, AudioSource *audio_source);

void js_define_audio_source_api(JSContext *ctx, JSValue *target);

#endif