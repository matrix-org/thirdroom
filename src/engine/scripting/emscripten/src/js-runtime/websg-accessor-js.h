#ifndef __websg_accessor_js_h
#define __websg_accessor_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

static JSClassID websg_accessor_class_id;

typedef struct WebSGAccessorData {
  accessor_id_t accessor_id;
} WebSGAccessorData;

void js_define_websg_accessor(JSContext *ctx);

#endif
