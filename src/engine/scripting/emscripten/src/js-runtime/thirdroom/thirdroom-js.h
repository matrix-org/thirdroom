#ifndef __thirdroom_js_h
#define __thirdroom_js_h
#include "../quickjs/quickjs.h"

extern JSClassID js_thirdroom_class_id;

void js_define_thirdroom_api(JSContext *ctx);

#endif
