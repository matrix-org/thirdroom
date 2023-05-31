#ifndef __websg_network_message_js_h
#define __websg_network_message_js_h
#include "../../websg-networking.h"
#include "../quickjs/quickjs.h"

extern JSClassID js_websg_network_message_class_id;

void js_websg_define_network_message(JSContext *ctx, JSValue websg_networking);

JSValue js_websg_new_network_message_instance(
  JSContext *ctx,
  JSValue peer,
  JSValue data,
  uint32_t bytes_written,
  int32_t is_binary
);

#endif
