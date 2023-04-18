#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./ui-element.h"
#include "./ui-element-iterator.h"

JSClassID js_websg_ui_element_iterator_class_id;

static void js_websg_ui_element_iterator_finalizer(JSRuntime *rt, JSValue val) {
  JSWebSGUIElementIteratorData *it = JS_GetOpaque(val, js_websg_ui_element_iterator_class_id);

  if (it) {
    js_free_rt(rt, it->ui_elements);
    js_free_rt(rt, it);
  }
}

static JSClassDef js_ref_ui_element_iterator_class = {
  "UIElementIterator",
  .finalizer = js_websg_ui_element_iterator_finalizer
};

static JSValue js_websg_ui_element_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  JSWebSGUIElementIteratorData *it = JS_GetOpaque2(ctx, this_val, js_websg_ui_element_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  if (it->idx >= it->count) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;

  ui_element_id_t ui_element_id = it->ui_elements[it->idx];

  JSValue val = js_websg_get_ui_element_by_id(ctx, it->world_data, ui_element_id);

  it->idx = it->idx + 1;

  return val;
}

static JSValue js_websg_ui_element_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}


static const JSCFunctionListEntry js_ui_element_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_websg_ui_element_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGNodeIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_websg_ui_element_iterator),
};

void js_websg_define_ui_element_iterator(JSContext *ctx) {
  JS_NewClassID(&js_websg_ui_element_iterator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_ui_element_iterator_class_id, &js_ref_ui_element_iterator_class);
  JSValue proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, proto, js_ui_element_iterator_proto_funcs, countof(js_ui_element_iterator_proto_funcs));
  JS_SetClassProto(ctx, js_websg_ui_element_iterator_class_id, proto);
}

JSValue js_websg_create_ui_element_iterator(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t *ui_elements, uint32_t count) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_websg_ui_element_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  JSWebSGUIElementIteratorData *it = js_mallocz(ctx, sizeof(JSWebSGUIElementIteratorData));

  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  it->world_data = world_data;
  it->ui_elements = ui_elements;
  it->idx = 0;
  it->count = count;

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}