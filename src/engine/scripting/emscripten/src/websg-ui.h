#ifndef __websg_ui_h
#define __websg_ui_h
#include <math.h>
#include <stdint.h>
#include "./websg.h"

#define import_websg_ui(NAME) __attribute__((import_module("websg_ui"),import_name(#NAME)))

typedef uint32_t ui_canvas_id_t;
typedef uint32_t ui_flex_id_t;
typedef uint32_t ui_button_id_t;
typedef uint32_t ui_text_id_t;

/**
 * UI Canvas
 **/

typedef struct UICanvasProps {
  float_t width;
  float_t height;
  float_t pixel_density;
} UICanvasProps;

import_websg_ui(create_ui_canvas) ui_canvas_id_t websg_ui_create_canvas(UICanvasProps *props);
import_websg_ui(node_set_ui_canvas) int32_t websg_node_set_ui_canvas(node_id_t node_id, ui_canvas_id_t canvas_id);
import_websg_ui(ui_canvas_set_root) int32_t websg_ui_canvas_set_root(ui_canvas_id_t canvas_id, ui_flex_id_t root_id);
import_websg_ui(ui_canvas_set_width) int32_t websg_ui_canvas_set_width(ui_canvas_id_t canvas_id, float_t width);
import_websg_ui(ui_canvas_set_height) int32_t websg_ui_canvas_set_height(ui_canvas_id_t canvas_id, float_t height);
import_websg_ui(ui_canvas_set_pixel_density) int32_t websg_ui_canvas_set_pixel_density(ui_canvas_id_t canvas_id, float_t pixel_density);
import_websg_ui(ui_canvas_redraw) int32_t websg_ui_canvas_redraw(ui_canvas_id_t canvas_id);

/**
 * UI Flex
 **/

typedef enum FlexDirection {
  FlexDirection_COLUMN,
  FlexDirection_COLUMN_REVERSE,
  FlexDirection_ROW,
  FlexDirection_ROW_REVERSE,
} FlexDirection;

typedef enum FlexEdge {
  FlexEdge_LEFT,
  FlexEdge_TOP,
  FlexEdge_RIGHT,
  FlexEdge_BOTTOM,
} FlexEdge;

typedef struct UIFlexProps {
  float_t width;
  float_t height;
  FlexDirection flex_direction;
  float_t background_color[4];
  float_t border_color[4];
  float_t padding[4];
  float_t margin[4];
} UIFlexProps;

import_websg_ui(create_ui_flex) ui_flex_id_t websg_ui_create_flex(UIFlexProps *props);
import_websg_ui(ui_flex_set_flex_direction) int32_t websg_ui_flex_set_flex_direction(ui_flex_id_t flex_id, FlexDirection flex_direction);
import_websg_ui(ui_flex_set_width) int32_t websg_ui_flex_set_width(ui_flex_id_t flex_id, float_t width);
import_websg_ui(ui_flex_set_height) int32_t websg_ui_flex_set_height(ui_flex_id_t flex_id, float_t height);
import_websg_ui(ui_flex_set_background_color) int32_t websg_ui_flex_set_background_color(ui_flex_id_t flex_id, float_t *color);
import_websg_ui(ui_flex_set_border_color) int32_t websg_ui_flex_set_border_color(ui_flex_id_t flex_id, float_t *color);
import_websg_ui(ui_flex_set_padding) int32_t websg_ui_flex_set_padding(ui_flex_id_t flex_id, float_t *padding);
import_websg_ui(ui_flex_set_margin) int32_t websg_ui_flex_set_margin(ui_flex_id_t flex_id, float_t *margin);
import_websg_ui(ui_flex_add_child) int32_t websg_ui_flex_add_child(ui_flex_id_t parent_id, ui_flex_id_t child_id);
import_websg_ui(ui_flex_add_text) int32_t websg_ui_flex_add_text(ui_flex_id_t parent_id, ui_text_id_t text_id);
import_websg_ui(ui_flex_add_button) int32_t websg_ui_flex_add_button(ui_flex_id_t parent_id, ui_button_id_t button_id);

/**
 * UI Button
 **/

import_websg_ui(create_ui_button) ui_button_id_t websg_ui_create_button(const char *label, size_t length);
import_websg_ui(ui_button_set_label) int32_t websg_ui_button_set_label(ui_button_id_t btn_id, char *label, size_t length);
import_websg_ui(ui_button_get_pressed) int32_t websg_ui_button_get_pressed(ui_button_id_t btn_id);
import_websg_ui(ui_button_get_held) int32_t websg_ui_button_get_held(ui_button_id_t btn_id);
import_websg_ui(ui_button_get_released) int32_t websg_ui_button_get_released(ui_button_id_t btn_id);

/**
 * UI Text
 **/

typedef struct UITextProps {
  float_t font_size;
  float_t color[4];

  const char *value;
  uint32_t value_length;

  const char *font_family;
  uint32_t font_family_length;

  const char *font_weight;
  uint32_t font_weight_length;

  const char *font_style;
  uint32_t font_style_length;
} UITextProps;

import_websg_ui(create_ui_text) ui_text_id_t websg_ui_create_text(UITextProps *props);
import_websg_ui(ui_text_set_value) int32_t websg_ui_text_set_value(ui_text_id_t txt_id, const char *value, size_t length);
import_websg_ui(ui_text_set_font_size) int32_t websg_ui_text_set_font_size(ui_text_id_t txt_id, float_t font_size);
import_websg_ui(ui_text_set_font_family) int32_t websg_ui_text_set_font_family(ui_text_id_t txt_id, const char *family, size_t length);
import_websg_ui(ui_text_set_font_style) int32_t websg_ui_text_set_font_style(ui_text_id_t txt_id, const char *style, size_t length);
import_websg_ui(ui_text_set_color) int32_t websg_ui_text_set_color(ui_text_id_t txt_id, float_t *color);

#endif