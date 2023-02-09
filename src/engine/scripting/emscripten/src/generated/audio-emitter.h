
#ifndef __audio_emitter_h
#define __audio_emitter_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_audio_emitter_class_id;

JSValue create_audio_emitter_from_ptr(JSContext *ctx, AudioEmitter *audio_emitter);

void js_define_audio_emitter_api(JSContext *ctx, JSValue *target);

#endif