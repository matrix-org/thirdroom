#ifndef __websg_ui_element_iterator_js_h
#define __websg_ui_element_iterator_js_h
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./world.h"

typedef struct JSWebSGUIElementIteratorData {
    WebSGWorldData *world_data;
    ui_element_id_t *ui_elements;
    uint32_t idx;
    uint32_t count;
} JSWebSGUIElementIteratorData;

extern JSClassID js_websg_ui_element_iterator_class_id;

void js_websg_define_ui_element_iterator(JSContext *ctx);

JSValue js_websg_create_ui_element_iterator(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t *ui_elements, uint32_t count);

#endif
