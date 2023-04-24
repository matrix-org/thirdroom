#ifndef __websg_component_js_h
#define __websg_component_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGComponentPropDefinition {
  const char *name;
  const char *type;
} WebSGComponentPropDefinition;

typedef struct WebSGComponentDefinitionData {
  WebSGWorldData *world_data;
  component_id_t component_id;
  WebSGComponentPropDefinition *prop_definitions;
  uint32_t prop_count;
} WebSGComponentDefinitionData;

extern JSClassID js_websg_component_definition_class_id;

void js_websg_define_component_definition(JSContext *ctx, JSValue websg);

JSValue js_websg_get_component_definition_by_id(
  JSContext *ctx,
  WebSGWorldData *world_data,
  component_id_t component_id
);

JSValue js_websg_world_find_component_definition_by_name(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
);

#endif
