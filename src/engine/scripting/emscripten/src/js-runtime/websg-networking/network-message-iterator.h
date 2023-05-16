#ifndef __websg_network_message_iterator_js_h
#define __websg_network_message_iterator_js_h
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./network-listener.h"

typedef struct WebSGNetworkMessageIteratorData {
    WebSGNetworkListenerData *listener_data;
    JSValue array_buffer;
    uint8_t* buffer_data;
    uint32_t buffer_size;
} WebSGNetworkMessageIteratorData;

extern JSClassID js_websg_network_message_iterator_class_id;

void js_websg_define_network_message_iterator(JSContext *ctx);

JSValue js_websg_create_network_message_iterator(
    JSContext *ctx,
    WebSGNetworkListenerData *listener_data,
    JSValue array_buffer
);

#endif
