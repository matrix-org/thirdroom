#ifndef __websg_component_js_h
#define __websg_component_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGComponentData {
  void* store;
  uint32_t component_store_index;
} WebSGComponentData;


extern JSClassID js_websg_component_class_id;

void js_websg_define_component(JSContext *ctx, JSValue websg);

#endif
