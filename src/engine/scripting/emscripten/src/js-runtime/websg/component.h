#ifndef __websg_component_js_h
#define __websg_component_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGComponentData {
  WebSGWorldData *world_data;
  void* store;
  uint32_t component_store_index;
  JSValue private_fields;
} WebSGComponentData;

extern JSClassID js_websg_component_class_id;

void js_websg_component_finalizer(JSRuntime *rt, JSValue val);

void js_websg_define_component(JSContext *ctx, JSValue websg);

JSClassID js_websg_define_component_instance(
  JSContext *ctx,
  component_id_t component_id,
  uint32_t component_store_size,
  size_t *component_store_byte_length
);

JSValue js_websg_create_component_instance(
  JSContext *ctx,
  WebSGWorldData *world_data,
  JSClassID component_instance_class_id,
  void *store,
  uint32_t component_store_index
);

#endif
