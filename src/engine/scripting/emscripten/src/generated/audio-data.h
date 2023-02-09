
#ifndef __audio_data_h
#define __audio_data_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_audio_data_class_id;

JSValue create_audio_data_from_ptr(JSContext *ctx, AudioData *audio_data);

void js_define_audio_data_api(JSContext *ctx, JSValue *target);

#endif