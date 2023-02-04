
#ifndef __audio_analyser_h
#define __audio_analyser_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_audio_analyser_class_id;

JSValue create_audio_analyser_from_ptr(JSContext *ctx, AudioAnalyser *audio_analyser);

void js_define_audio_analyser_api(JSContext *ctx, JSValue *target);

#endif