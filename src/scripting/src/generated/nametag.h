
#ifndef __nametag_h
#define __nametag_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_nametag_class_id;

JSValue create_nametag_from_ptr(JSContext *ctx, Nametag *nametag);

void js_define_nametag_api(JSContext *ctx, JSValue *target);

#endif