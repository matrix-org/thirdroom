
#ifndef __interactable_h
#define __interactable_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_interactable_class_id;

JSValue create_interactable_from_ptr(JSContext *ctx, Interactable *interactable);

void js_define_interactable_api(JSContext *ctx, JSValue *target);

#endif