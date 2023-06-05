#ifndef __js_websg_world_h
#define __js_websg_world_h
#include "../quickjs/quickjs.h"

typedef struct WebSGWorldData {
  JSValue accessors;
  JSValue colliders;
  JSValue lights;
  JSValue materials;
  JSValue meshes;
  JSValue nodes;
  JSValue scenes;
  JSValue textures;
  JSValue images;
  JSValue ui_canvases;
  JSValue ui_elements;
  JSValue component_stores;
} WebSGWorldData;

extern JSClassID js_websg_world_class_id;

void js_websg_define_world(JSContext *ctx, JSValue websg);

JSValue js_websg_new_world(JSContext *ctx);

#endif
