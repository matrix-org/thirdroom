#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./ui-element.h"
#include "./ui-text.h"
#include "../utils/array.h"

JSClassID js_websg_ui_button_class_id;

/**
 * Class Definition
 **/

static void js_websg_ui_button_finalizer(JSRuntime *rt, JSValue val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(val);

  if (ui_element_data) {
    js_free_rt(rt, ui_element_data);
  }
}

static JSClassDef js_websg_ui_button_class = {
  "UIButton",
  .finalizer = js_websg_ui_button_finalizer
};

static JSValue js_websg_ui_button_get_label(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_button_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t length = websg_ui_button_get_label_length(ui_button_data->ui_element_id);

  const char *str = js_mallocz(ctx, sizeof(char) * length);

  int32_t result = websg_ui_button_get_label(ui_button_data->ui_element_id, str, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting label.");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, str, length);
}

static JSValue js_websg_ui_button_set_label(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_button_data = JS_GetOpaque_UNSAFE(this_val);

  size_t length;
  const char* label = JS_ToCStringLen(ctx, &length, arg);

  if (label == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_button_set_label(ui_button_data->ui_element_id, label, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting label.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_button_get_pressed(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_button_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t result = websg_ui_button_get_pressed(ui_button_data->ui_element_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting button pressed state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_ui_button_get_held(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_button_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t result = websg_ui_button_get_held(ui_button_data->ui_element_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting button held state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_ui_button_get_released(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_button_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t result = websg_ui_button_get_released(ui_button_data->ui_element_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting button released state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_websg_ui_button_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JS_ThrowInternalError(ctx, "WebSG: UIButton doesn't support adding children.");
  return JS_EXCEPTION;
}

static JSValue js_websg_ui_button_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JS_ThrowInternalError(ctx, "WebSG: UIButton doesn't support removing children.");
  return JS_EXCEPTION;
}

static const JSCFunctionListEntry js_websg_ui_button_proto_funcs[] = {
  JS_CGETSET_DEF("label", js_websg_ui_button_get_label, js_websg_ui_button_set_label),
  JS_CGETSET_DEF("pressed", js_websg_ui_button_get_pressed, NULL),
  JS_CGETSET_DEF("held", js_websg_ui_button_get_held, NULL),
  JS_CGETSET_DEF("released", js_websg_ui_button_get_released, NULL),
  JS_CFUNC_DEF("addChild", 1, js_websg_ui_button_add_child),
  JS_CFUNC_DEF("removeChild", 1, js_websg_ui_button_remove_child),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "UIButton", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_ui_button_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_ui_button(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_ui_button_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_ui_button_class_id, &js_websg_ui_button_class);
  JSValue ui_button_proto = JS_NewObject(ctx);
  JSValue ui_text_proto = JS_GetClassProto(ctx, js_websg_ui_text_class_id);
  JS_SetPropertyFunctionList(ctx, ui_button_proto, js_websg_ui_button_proto_funcs, countof(js_websg_ui_button_proto_funcs));
  JS_SetPrototype(ctx, ui_button_proto, ui_text_proto);
  JS_SetClassProto(ctx, js_websg_ui_button_class_id, ui_button_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_ui_button_constructor,
    "UIButton",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, ui_button_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "UIButton",
    constructor
  );
}

JSValue js_websg_new_ui_button_instance(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t ui_element_id) {
  JSValue ui_button = JS_NewObjectClass(ctx, js_websg_ui_button_class_id);

  if (JS_IsException(ui_button)) {
    return ui_button;
  }

  js_define_ui_text_props(ctx, world_data, ui_element_id, ui_button);

  WebSGUIElementData *element_data = js_mallocz(ctx, sizeof(WebSGUIElementData));
  element_data->world_data = world_data;
  element_data->ui_element_id = ui_element_id;
  JS_SetOpaque(ui_button, element_data);

  JS_SetPropertyUint32(ctx, world_data->ui_elements, ui_element_id, JS_DupValue(ctx, ui_button));

  return ui_button;
}

/**
 * World Methods
 **/

JSValue js_websg_world_create_ui_button(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  UIElementProps *props = js_mallocz(ctx, sizeof(UIElementProps));

  props->type = ElementType_BUTTON;
  props->flex_basis = -1;
  props->max_height = -1;
  props->max_width = -1;
  props->min_height = -1;
  props->min_width = -1;
  props->height = -1;
  props->width = -1;
  props->justify_content = FlexJustify_FLEX_START;
  props->flex_shrink = 1.0f;
  props->flex_wrap = FlexWrap_NO_WRAP;
  props->flex_direction = FlexDirection_ROW;
  props->align_self = FlexAlign_AUTO;
  props->align_items = FlexAlign_STRETCH;
  props->align_content = FlexAlign_FLEX_START;
  props->position_type = ElementPositionType_RELATIVE;

  // Similar to default HTML Button Styles
  props->background_color[0] = 0.913725f;
  props->background_color[1] = 0.913725f;
  props->background_color[2] = 0.929412f;
  props->background_color[3] = 1.0f;

  props->border_color[0] = 0.560784f;
  props->border_color[1] = 0.560784f;
  props->border_color[2] = 0.615686f;
  props->border_color[3] = 1.0f;

  props->border_width[0] = 1.0f;
  props->border_width[1] = 1.0f;
  props->border_width[2] = 1.0f;
  props->border_width[3] = 1.0f;

  props->border_radius[0] = 4.0f;
  props->border_radius[1] = 4.0f;
  props->border_radius[2] = 4.0f;
  props->border_radius[3] = 4.0f;

  props->padding[0] = 2.0f;
  props->padding[1] = 6.0f;
  props->padding[2] = 2.0f;
  props->padding[3] = 6.0f;

  UIButtonProps *button_props = js_mallocz(ctx, sizeof(UIButtonProps));
  props->button = button_props;

  UITextProps *text_props = js_mallocz(ctx, sizeof(UITextProps));
  props->text = text_props;

  if (js_websg_parse_ui_element_props(ctx, world_data, props, argv[0]) < 0) {
    return JS_EXCEPTION;
  }

  if (js_websg_parse_ui_text_props(ctx, world_data, props->text, argv[0]) < 0) {
    return JS_EXCEPTION;
  }

  JSValue label_val = JS_GetPropertyStr(ctx, argv[0], "label");

  if (!JS_IsUndefined(label_val)) {
    size_t label_len;
    button_props->label.value = JS_ToCStringLen(ctx, &label_len, label_val);
    button_props->label.length = (uint32_t)label_len;

    if (button_props->label.value == NULL) {
      return JS_EXCEPTION;
    }
  }

  ui_element_id_t ui_element_id = websg_world_create_ui_element(props);

  if (ui_element_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UIButton.");
    return JS_EXCEPTION;
  }

  return js_websg_new_ui_button_instance(ctx, world_data, ui_element_id);
}
