#include "./quickjs/quickjs.h"

#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "./js-utils.h"
#include "../websg-ui.h"
#include "./websg-ui-js.h"

#include <emscripten/console.h>

/*************
 * UI Canvas *
 ************/

static JSValue js_create_ui_canvas(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  UICanvasProps *props = js_mallocz(ctx, sizeof(UICanvasProps));

  JSValue width_val = JS_GetPropertyStr(ctx, argv[0], "width");

  if (!JS_IsUndefined(width_val)) {
    double width;

    if (JS_ToFloat64(ctx, &width, width_val) == -1) {
      return JS_EXCEPTION;
    }

    props->width = (float_t)width;
  }

  JSValue height_val = JS_GetPropertyStr(ctx, argv[0], "height");

  if (!JS_IsUndefined(height_val)) {
    double height;

    if (JS_ToFloat64(ctx, &height, height_val) == -1) {
      return JS_EXCEPTION;
    }

    props->height = (float_t)height;
  }

  JSValue pixel_density_val = JS_GetPropertyStr(ctx, argv[0], "pixelDensity");

  if (!JS_IsUndefined(pixel_density_val)) {
    double pixel_density;

    if (JS_ToFloat64(ctx, &pixel_density, pixel_density_val) == -1) {
      return JS_EXCEPTION;
    }
    props->pixel_density = (float_t)pixel_density;
  }

  ui_canvas_id_t canvas_id = websg_ui_create_canvas(props);

  if (canvas_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UI canvas.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, canvas_id);
}

static JSValue js_node_set_ui_canvas(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  ui_canvas_id_t child_id;

  if (JS_ToUint32(ctx, &child_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_node_set_ui_canvas(node_id, child_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error adding UI canvas to node.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_ui_canvas_set_root(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_canvas_id_t canvas_id;
  if (JS_ToUint32(ctx, &canvas_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  ui_flex_id_t root_id;
  if (JS_ToUint32(ctx, &root_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_canvas_set_root(canvas_id, root_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI canvas root.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_canvas_set_width(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_canvas_id_t canvas_id;
  if (JS_ToUint32(ctx, &canvas_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t width;
  if (JS_ToFloat64(ctx, &width, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_canvas_set_width(canvas_id, (float_t)width);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI canvas width.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_canvas_set_height(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_canvas_id_t canvas_id;
  if (JS_ToUint32(ctx, &canvas_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t height;
  if (JS_ToFloat64(ctx, &height, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_canvas_set_height(canvas_id, (float_t)height);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI canvas height.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_canvas_set_pixel_density(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_canvas_id_t canvas_id;
  if (JS_ToUint32(ctx, &canvas_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t pixel_density;
  if (JS_ToFloat64(ctx, &pixel_density, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_canvas_set_pixel_density(canvas_id, (float_t)pixel_density);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI canvas pixel density.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_canvas_redraw(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_canvas_id_t canvas_id;
  if (JS_ToUint32(ctx, &canvas_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  int32_t result = websg_ui_canvas_redraw(canvas_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error redrawing UI canvas.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

/*************
 * UI Flex *
 ************/

static JSValue js_create_ui_flex(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  UIFlexProps *props = js_mallocz(ctx, sizeof(UIFlexProps));

  JSValue width_val = JS_GetPropertyStr(ctx, argv[0], "width");

  if (!JS_IsUndefined(width_val)) {
    double_t width;

    if (JS_ToFloat64(ctx, &width, width_val) == -1) {
      return JS_EXCEPTION;
    }

    props->width = (float_t)width;
  }

  JSValue height_val = JS_GetPropertyStr(ctx, argv[0], "height");

  if (!JS_IsUndefined(height_val)) {
    double_t height;

    if (JS_ToFloat64(ctx, &height, height_val) == -1) {
      return JS_EXCEPTION;
    }

    props->height = (float_t)height;
  }

  JSValue flex_direction_val = JS_GetPropertyStr(ctx, argv[0], "flexDirection");

  if (!JS_IsUndefined(flex_direction_val)) {
    JS_ToUint32(ctx, &props->flex_direction, flex_direction_val);
  }

  JSValue background_color_val = JS_GetPropertyStr(ctx, argv[0], "backgroundColor");

  if (!JS_IsUndefined(background_color_val)) {
    float_t *background_color = get_typed_array_data(ctx, &background_color_val, sizeof(float_t) * 4);

    if (background_color == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->background_color, background_color, sizeof(float_t) * 4);
  }

  JSValue border_color_val = JS_GetPropertyStr(ctx, argv[0], "borderColor");

  if (!JS_IsUndefined(border_color_val)) {
    float_t *border_color = get_typed_array_data(ctx, &border_color_val, sizeof(float_t) * 4);

    if (border_color == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->border_color, border_color, sizeof(float_t) * 4);
  }

  JSValue padding_val = JS_GetPropertyStr(ctx, argv[0], "padding");

  if (!JS_IsUndefined(padding_val)) {
    float_t *padding = get_typed_array_data(ctx, &padding_val, sizeof(float_t) * 4);

    if (padding == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->padding, padding, sizeof(float_t) * 4);
  }

  JSValue margin_val = JS_GetPropertyStr(ctx, argv[0], "margin");

  if (!JS_IsUndefined(margin_val)) {
    float_t *margin = get_typed_array_data(ctx, &margin_val, sizeof(float_t) * 4);

    if (margin == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->margin, margin, sizeof(float_t) * 4);
  }

  ui_flex_id_t flex_id = websg_ui_create_flex(props);

  if (flex_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UI flex.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, flex_id);
}

static JSValue js_ui_flex_set_flex_direction(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t flex_direction;
  if (JS_ToFloat64(ctx, &flex_direction, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_flex_set_flex_direction(flex_id, (float_t)flex_direction);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex flex_direction.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_flex_set_width(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t width;
  if (JS_ToFloat64(ctx, &width, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_flex_set_width(flex_id, (float_t)width);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex width.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_flex_set_height(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t height;
  if (JS_ToFloat64(ctx, &height, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_flex_set_height(flex_id, (float_t)height);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex height.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_flex_set_background_color(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG UI: Invalid RGBA length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_ui_flex_set_background_color(flex_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex background_color.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_ui_flex_set_border_color(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG UI: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_ui_flex_set_border_color(flex_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex border_color.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_ui_flex_set_padding(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG UI: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_ui_flex_set_padding(flex_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex padding.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_ui_flex_set_margin(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;
  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG UI: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_ui_flex_set_margin(flex_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI flex margin.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_ui_flex_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;

  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  ui_flex_id_t child_id;

  if (JS_ToUint32(ctx, &child_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_ui_flex_add_child(flex_id, child_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error adding child to UI flex.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_ui_flex_add_text(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;

  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  ui_text_id_t text_id;

  if (JS_ToUint32(ctx, &text_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_ui_flex_add_text(flex_id, text_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error adding text to UI flex.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_ui_flex_add_button(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_flex_id_t flex_id;

  if (JS_ToUint32(ctx, &flex_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  ui_button_id_t button_id;

  if (JS_ToUint32(ctx, &button_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_ui_flex_add_button(flex_id, button_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error adding button to UI flex.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

/*************
 * UI Button *
 ************/

static JSValue js_create_ui_button(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t length;
  const char* label = JS_ToCStringLen(ctx, &length, argv[0]);

  ui_button_id_t button_id = websg_ui_create_button(label, length);

  if (button_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UI button.");
    return JS_EXCEPTION;
  }


  return JS_NewUint32(ctx, button_id);
}

static JSValue js_ui_button_set_label(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_button_id_t button_id;

  if (JS_ToUint32(ctx, &button_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t length;
  const char* value = JS_ToCStringLen(ctx, &length, argv[1]);

  if (value == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_value(button_id, value, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting button label.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_button_get_pressed(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_button_id_t btn_id;

  if (JS_ToUint32(ctx, &btn_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_button_get_pressed(btn_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error getting interactable pressed state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_button_get_held(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_button_id_t btn_id;

  if (JS_ToUint32(ctx, &btn_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_button_get_held(btn_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error getting interactable held state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_button_get_released(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_button_id_t btn_id;

  if (JS_ToUint32(ctx, &btn_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_button_get_released(btn_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error getting interactable released state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}


/*************
 * UI Text *
 ************/

static JSValue js_create_ui_text(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  UITextProps *props = js_mallocz(ctx, sizeof(UITextProps));

  JSValue value_val = JS_GetPropertyStr(ctx, argv[0], "value");

  if (!JS_IsUndefined(value_val)) {
    size_t length;
    const char* value = JS_ToCStringLen(ctx, &length, value_val);

    if (value == NULL) {
      return JS_EXCEPTION;
    }

    props->value_length = length;
    props->value = value;
  }

  JSValue font_family_val = JS_GetPropertyStr(ctx, argv[0], "fontFamily");

  if (!JS_IsUndefined(font_family_val)) {
    size_t length;
    const char* font_family = JS_ToCStringLen(ctx, &length, font_family_val);

    if (font_family == NULL) {
      return JS_EXCEPTION;
    }

    props->font_family_length = length;
    props->font_family = font_family;
  }

  JSValue font_weight_val = JS_GetPropertyStr(ctx, argv[0], "fontWeight");

  if (!JS_IsUndefined(font_weight_val)) {
    size_t length;
    const char* font_weight = JS_ToCStringLen(ctx, &length, font_weight_val);

    if (font_weight == NULL) {
      return JS_EXCEPTION;
    }

    props->font_weight_length = length;
    props->font_weight = font_weight;
  }

  JSValue font_style_val = JS_GetPropertyStr(ctx, argv[0], "fontStyle");

  if (!JS_IsUndefined(font_style_val)) {
    size_t length;
    const char* font_style = JS_ToCStringLen(ctx, &length, font_style_val);

    if (font_style == NULL) {
      return JS_EXCEPTION;
    }

    props->font_style_length = length;
    props->font_style = font_style;
  }

  JSValue font_size_val = JS_GetPropertyStr(ctx, argv[0], "fontSize");

  if (!JS_IsUndefined(font_size_val)) {
    double_t font_size;

    if (JS_ToFloat64(ctx, &font_size, font_size_val) == -1) {
      return JS_EXCEPTION;
    }

    props->font_size = (float_t) font_size;
  }

  JSValue color_val = JS_GetPropertyStr(ctx, argv[0], "color");

  if (!JS_IsUndefined(color_val)) {
    float_t *color = get_typed_array_data(ctx, &color_val, sizeof(float_t) * 4);

    if (color == NULL) {
      return JS_EXCEPTION;
    }

    memcpy(props->color, color, sizeof(float_t) * 4);
  }

  ui_text_id_t text_id = websg_ui_create_text(props);

  if (text_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UI text.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, text_id);
}

static JSValue js_ui_text_set_value(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_text_id_t text_id;

  if (JS_ToUint32(ctx, &text_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t length;
  const char* value = JS_ToCStringLen(ctx, &length, argv[1]);

  if (value == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_value(text_id, value, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting text value.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_text_set_font_size(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint32_t text_id;
  if (JS_ToUint32(ctx, &text_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  double_t font_size;
  if (JS_ToFloat64(ctx, &font_size, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_size(text_id, (float_t)font_size);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI text font_size.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_text_set_font_family(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_text_id_t text_id;

  if (JS_ToUint32(ctx, &text_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t length;
  const char* family = JS_ToCStringLen(ctx, &length, argv[1]);

  if (family == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_family(text_id, family, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting text font_family.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_text_set_font_style(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_text_id_t text_id;

  if (JS_ToUint32(ctx, &text_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t length;
  const char* style = JS_ToCStringLen(ctx, &length, argv[1]);

  if (style == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_text_set_font_style(text_id, style, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting text font_style.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_ui_text_set_color(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ui_text_id_t text_id;
  if (JS_ToUint32(ctx, &text_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }
  
  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG UI: Invalid RGBA length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_ui_text_set_color(text_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error setting UI text color.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

void js_define_websg_ui_api(JSContext *ctx, JSValue *target) {
  JSValue ui = JS_NewObject(ctx);

  // UI Canvas
  JS_SetPropertyStr(ctx, ui, "createUICanvas", JS_NewCFunction(ctx, js_create_ui_canvas, "createUICanvas", 1));
  JS_SetPropertyStr(ctx, ui, "nodeSetUICanvas", JS_NewCFunction(ctx, js_node_set_ui_canvas, "nodeSetUICanvas", 2));
  JS_SetPropertyStr(ctx, ui, "uiCanvasSetRoot", JS_NewCFunction(ctx, js_ui_canvas_set_root, "uiCanvasSetRoot", 2));
  JS_SetPropertyStr(ctx, ui, "uiCanvasSetWidth", JS_NewCFunction(ctx, js_ui_canvas_set_width, "uiCanvasSetWidth", 2));
  JS_SetPropertyStr(ctx, ui, "uiCanvasSetHeight", JS_NewCFunction(ctx, js_ui_canvas_set_height, "uiCanvasSetHeight", 2));
  JS_SetPropertyStr(ctx, ui, "uiCanvasSetPixelDensity", JS_NewCFunction(ctx, js_ui_canvas_set_pixel_density, "uiCanvasSetPixelDensity", 2));
  JS_SetPropertyStr(ctx, ui, "uiCanvasRedraw", JS_NewCFunction(ctx, js_ui_canvas_redraw, "uiCanvasRedraw", 1));

  // UI Flex
  JS_SetPropertyStr(ctx, ui, "createUIFlex", JS_NewCFunction(ctx, js_create_ui_flex, "createUIFlex", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetFlexDirection", JS_NewCFunction(ctx, js_ui_flex_set_flex_direction, "uiFlexSetFlexDirection", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetWidth", JS_NewCFunction(ctx, js_ui_flex_set_width, "uiFlexSetWidth", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetHeight", JS_NewCFunction(ctx, js_ui_flex_set_height, "uiFlexSetHeight", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetBackgroundColor", JS_NewCFunction(ctx, js_ui_flex_set_background_color, "uiFlexSetBackgroundColor", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetBorderColor", JS_NewCFunction(ctx, js_ui_flex_set_border_color, "uiFlexSetBorderColor", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetPadding", JS_NewCFunction(ctx, js_ui_flex_set_padding, "uiFlexSetPadding", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexSetMargin", JS_NewCFunction(ctx, js_ui_flex_set_margin, "uiFlexSetMargin", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexAddChild", JS_NewCFunction(ctx, js_ui_flex_add_child, "uiFlexAddChild", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexAddText", JS_NewCFunction(ctx, js_ui_flex_add_text, "uiFlexAddText", 2));
  JS_SetPropertyStr(ctx, ui, "uiFlexAddButton", JS_NewCFunction(ctx, js_ui_flex_add_button, "uiFlexAddButton", 2));

  // UI Button
  JS_SetPropertyStr(ctx, ui, "createUIButton", JS_NewCFunction(ctx, js_create_ui_button, "createUIButton", 0));
  JS_SetPropertyStr(ctx, ui, "uiButtonSetLabel", JS_NewCFunction(ctx, js_create_ui_button, "uiButtonSetLabel", 0));
  JS_SetPropertyStr(ctx, ui, "uiButtonGetPressed", JS_NewCFunction(ctx, js_ui_button_get_pressed, "uiButtonGetPressed", 1));
  JS_SetPropertyStr(ctx, ui, "uiButtonGetHeld", JS_NewCFunction(ctx, js_ui_button_get_held, "uiButtonGetHeld", 1));
  JS_SetPropertyStr(ctx, ui, "uiButtonGetReleased", JS_NewCFunction(ctx, js_ui_button_get_released, "uiButtonGetReleased", 1));

  // UI Text
  JS_SetPropertyStr(ctx, ui, "createUIText", JS_NewCFunction(ctx, js_create_ui_text, "createUIText", 1));
  JS_SetPropertyStr(ctx, ui, "uiTextSetValue", JS_NewCFunction(ctx, js_ui_text_set_value, "uiTextSetValue", 2));
  JS_SetPropertyStr(ctx, ui, "uiTextSetFontSize", JS_NewCFunction(ctx, js_ui_text_set_font_size, "uiTextSetFontSize", 2));
  JS_SetPropertyStr(ctx, ui, "uiTextSetFontFamily", JS_NewCFunction(ctx, js_ui_text_set_font_family, "uiTextSetFontFamily", 2));
  JS_SetPropertyStr(ctx, ui, "uiTextSetFontStyle", JS_NewCFunction(ctx, js_ui_text_set_font_style, "uiTextSetFontStyle", 2));
  JS_SetPropertyStr(ctx, ui, "uiTextSetColor", JS_NewCFunction(ctx, js_ui_text_set_color, "uiTextSetColor", 2));

  JS_SetPropertyStr(ctx, *target, "UI", ui);
}