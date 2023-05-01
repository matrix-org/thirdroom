#ifndef __websg_component_store_js_h
#define __websg_component_store_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGComponentStoreData {
  WebSGWorldData *world_data;
  component_id_t component_id;
  JSValue component_instances;
  JSClassID component_instance_class_id;
  uint32_t *prop_byte_offsets;
  void* store;
} WebSGComponentStoreData;

extern JSClassID js_websg_component_store_class_id;

void js_websg_define_component_store(JSContext *ctx, JSValue websg);

JSValue js_websg_get_component_store_by_id(
  JSContext *ctx,
  WebSGWorldData *world_data,
  component_id_t component_id
);

JSValue js_websg_world_find_component_store_by_name(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
);

JSValue js_websg_component_store_get_instance(
  JSContext *ctx,
  WebSGComponentStoreData *component_store_data,
  uint32_t component_store_index
);

#endif
