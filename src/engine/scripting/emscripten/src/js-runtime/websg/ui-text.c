#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./ui-element.h"
#include "./ui-text.h"
#include "./rgba.h"
#include "../utils/array.h"

JSClassID js_websg_ui_text_class_id;

/**
 * Class Definition
 **/

static void js_websg_ui_text_finalizer(JSRuntime *rt, JSValue val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(val);

  if (ui_element_data) {
    js_free_rt(rt, ui_element_data);
  }
}

static JSClassDef js_websg_ui_text_class = {
  "UIText",
  .finalizer = js_websg_ui_text_finalizer
};

static JSValue js_websg_ui_text_get_value(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t length = websg_ui_text_get_value_length(ui_text_data->ui_element_id);

  const char *str = js_mallocz(ctx, sizeof(char) * length);

  int32_t result = websg_ui_text_get_value(ui_text_data->ui_element_id, str, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting value.");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, str, length);
}

static JSValue js_websg_ui_text_set_value(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  size_t length;
  const char* value = JS_ToCStringLen(ctx, &length, arg);

  if (value == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_value(ui_text_data->ui_element_id, value, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting value.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_text_get_font_family(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t length = websg_ui_text_get_font_family_length(ui_text_data->ui_element_id);

  const char *str = js_mallocz(ctx, sizeof(char) * length);

  int32_t result = websg_ui_text_get_font_family(ui_text_data->ui_element_id, str, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting fontFamily.");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, str, length);
}

static JSValue js_websg_ui_text_set_font_family(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  size_t length;
  const char* font_family = JS_ToCStringLen(ctx, &length, arg);

  if (font_family == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_family(ui_text_data->ui_element_id, font_family, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting fontFamily.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_text_get_font_weight(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t length = websg_ui_text_get_font_weight_length(ui_text_data->ui_element_id);

  const char *str = js_mallocz(ctx, sizeof(char) * length);

  int32_t result = websg_ui_text_get_font_weight(ui_text_data->ui_element_id, str, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting fontWeight.");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, str, length);
}

static JSValue js_websg_ui_text_set_font_weight(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  size_t length;
  const char* font_weight = JS_ToCStringLen(ctx, &length, arg);

  if (font_weight == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_weight(ui_text_data->ui_element_id, font_weight, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting fontWeight.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_text_get_font_size(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_text_get_font_size(ui_text_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_text_set_font_size(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_size(ui_text_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting fontSize.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_text_get_font_style(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t length = websg_ui_text_get_font_style_length(ui_text_data->ui_element_id);

  const char *str = js_mallocz(ctx, sizeof(char) * length);

  int32_t result = websg_ui_text_get_font_style(ui_text_data->ui_element_id, str, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting fontStyle.");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, str, length);
}

static JSValue js_websg_ui_text_set_font_style(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_text_data = JS_GetOpaque_UNSAFE(this_val);

  size_t length;
  const char* font_style = JS_ToCStringLen(ctx, &length, arg);

  if (font_style == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_style(ui_text_data->ui_element_id, font_style, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting fontStyle.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_text_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JS_ThrowInternalError(ctx, "WebSG: UIText doesn't support adding children.");
  return JS_EXCEPTION;
}

static JSValue js_websg_ui_text_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JS_ThrowInternalError(ctx, "WebSG: UIText doesn't support removing children.");
  return JS_EXCEPTION;
}

static const JSCFunctionListEntry js_websg_ui_text_proto_funcs[] = {
  JS_CGETSET_DEF("value", js_websg_ui_text_get_value, js_websg_ui_text_set_value),
  JS_CGETSET_DEF("fontFamily", js_websg_ui_text_get_font_family, js_websg_ui_text_set_font_family),
  JS_CGETSET_DEF("fontWeight", js_websg_ui_text_get_font_weight, js_websg_ui_text_set_font_weight),
  JS_CGETSET_DEF("fontSize", js_websg_ui_text_get_font_size, js_websg_ui_text_set_font_size),
  JS_CGETSET_DEF("fontStyle", js_websg_ui_text_get_font_style, js_websg_ui_text_set_font_style),
  JS_CFUNC_DEF("addChild", 1, js_websg_ui_text_add_child),
  JS_CFUNC_DEF("removeChild", 1, js_websg_ui_text_remove_child),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "UIText", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_ui_text_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_ui_text(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_ui_text_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_ui_text_class_id, &js_websg_ui_text_class);
  JSValue ui_text_proto = JS_NewObject(ctx);
  JSValue ui_element_proto = JS_GetClassProto(ctx, js_websg_ui_element_class_id);
  JS_SetPropertyFunctionList(ctx, ui_text_proto, js_websg_ui_text_proto_funcs, countof(js_websg_ui_text_proto_funcs));
  JS_SetPrototype(ctx, ui_text_proto, ui_element_proto);
  JS_SetClassProto(ctx, js_websg_ui_text_class_id, ui_text_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_ui_text_constructor,
    "UIText",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, ui_text_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "UIText",
    constructor
  );
}

void js_define_ui_text_props(
  JSContext *ctx,
  WebSGWorldData *world_data,
  ui_element_id_t ui_element_id,
  JSValue ui_text
) {
  js_define_ui_element_props(ctx, world_data, ui_element_id, ui_text);

  js_websg_define_rgba_prop(
    ctx,
    ui_text,
    "color",
    ui_element_id,
    &websg_ui_text_get_color_element,
    &websg_ui_text_set_color_element,
    &websg_ui_text_set_color
  );
}

JSValue js_websg_new_ui_text_instance(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t ui_element_id) {
  JSValue ui_text = JS_NewObjectClass(ctx, js_websg_ui_text_class_id);

  if (JS_IsException(ui_text)) {
    return ui_text;
  }

  js_define_ui_text_props(ctx, world_data, ui_element_id, ui_text);

  WebSGUIElementData *element_data = js_mallocz(ctx, sizeof(WebSGUIElementData));
  element_data->world_data = world_data;
  element_data->ui_element_id = ui_element_id;
  JS_SetOpaque(ui_text, element_data);

  JS_SetPropertyUint32(ctx, world_data->ui_elements, ui_element_id, JS_DupValue(ctx, ui_text));
  
  return ui_text;
}

/**
 * World Methods
 **/

int js_websg_parse_ui_text_props(
  JSContext *ctx,
  WebSGWorldData *world_data,
  UITextProps *props,
  JSValueConst arg
) {
  JSValue value_val = JS_GetPropertyStr(ctx, arg, "value");

  if (!JS_IsUndefined(value_val)) {
    size_t value_len;
    props->value.value = JS_ToCStringLen(ctx, &value_len, value_val);
    props->value.length = (uint32_t)value_len;

    if (props->value.value == NULL) {
      return -1;
    }
  }

  JSValue font_family_val = JS_GetPropertyStr(ctx, arg, "fontFamily");

  if (!JS_IsUndefined(font_family_val)) {
    size_t font_style_len;
    props->font_family.value = JS_ToCStringLen(ctx, &font_style_len, font_family_val);
    props->font_family.length = (uint32_t)font_style_len;

    if (props->font_family.value == NULL) {
      return -1;
    }
  }

  JSValue font_style_val = JS_GetPropertyStr(ctx, arg, "fontStyle");

  if (!JS_IsUndefined(font_style_val)) {
    size_t font_style_len;
    props->font_style.value = JS_ToCStringLen(ctx, &font_style_len, font_style_val);
    props->font_style.length = (uint32_t)font_style_len;

    if (props->font_style.value == NULL) {
      return -1;
    }
  }

  JSValue font_weight_val = JS_GetPropertyStr(ctx, arg, "fontWeight");

  if (!JS_IsUndefined(font_weight_val)) {
    size_t font_weight_len;
    props->font_weight.value = JS_ToCStringLen(ctx, &font_weight_len, font_weight_val);
    props->font_weight.length = (uint32_t)font_weight_len;

    if (props->font_weight.value == NULL) {
      return -1;
    }
  }

  JSValue color_val = JS_GetPropertyStr(ctx, arg, "color");

  if (!JS_IsUndefined(color_val)) {
    if (js_get_float_array_like(ctx, color_val, props->color, 4) < 0) {
      return -1;
    }
  } else {
    props->color[0] = 0.0f;
    props->color[1] = 0.0f;
    props->color[2] = 0.0f;
    props->color[3] = 1.0f;
  }

  JSValue font_size_val = JS_GetPropertyStr(ctx, arg, "fontSize");

  if (!JS_IsUndefined(font_size_val)) {
    double_t font_size;

    if (JS_ToFloat64(ctx, &font_size, font_size_val) == -1) {
      return -1;
    }

    props->font_size = (float_t)font_size;
  } else {
    props->font_size = 16.0f;
  }

  return 0;
}

JSValue js_websg_world_create_ui_text(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  UIElementProps *props = js_mallocz(ctx, sizeof(UIElementProps));

  props->type = ElementType_TEXT;
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

  UITextProps *text_props = js_mallocz(ctx, sizeof(UITextProps));
  props->text = text_props;

  if (js_websg_parse_ui_element_props(ctx, world_data, props, argv[0]) < 0) {
    return JS_EXCEPTION;
  }

  if (js_websg_parse_ui_text_props(ctx, world_data, props->text, argv[0]) < 0) {
    return JS_EXCEPTION;
  }

  ui_element_id_t ui_element_id = websg_world_create_ui_element(props);

  if (ui_element_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UIText.");
    return JS_EXCEPTION;
  }

  return js_websg_new_ui_text_instance(ctx, world_data, ui_element_id);
}
