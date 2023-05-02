#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./ui-element.h"
#include "./ui-text.h"
#include "./ui-button.h"
#include "./rgba.h"
#include "./vector4.h"
#include "./ui-element-iterator.h"
#include "../utils/array.h"

JSClassID js_websg_ui_element_class_id;

JSAtom flex_atom;
JSAtom text_atom;
JSAtom button_atom;
JSAtom column_atom;
JSAtom column_reverse_atom;
JSAtom row_atom;
JSAtom row_reverse_atom;
JSAtom relative_atom;
JSAtom absolute_atom;
JSAtom auto_atom;
JSAtom flex_start_atom;
JSAtom center_atom;
JSAtom flex_end_atom;
JSAtom stretch_atom;
JSAtom baseline_atom;
JSAtom space_between_atom;
JSAtom space_around_atom;
JSAtom space_evenly_atom;
JSAtom no_wrap_atom;
JSAtom wrap_atom;
JSAtom wrap_reverse_atom;

ElementType get_element_type_from_atom(JSAtom atom) {
  if (atom == flex_atom) {
    return ElementType_FLEX;
  } else if (atom == text_atom) {
    return ElementType_TEXT;
  } else if (atom == button_atom) {
    return ElementType_BUTTON;
  } else {
    return -1;
  }
}

JSAtom get_atom_from_element_type(ElementType type) {
  if (type == ElementType_FLEX) {
    return flex_atom;
  } else if (type == ElementType_TEXT) {
    return text_atom;
  } else if (type == ElementType_BUTTON) {
    return button_atom;
  } else {
    return JS_ATOM_NULL;
  }
}

FlexDirection get_flex_direction_from_atom(JSAtom atom) {
  if (atom == column_atom) {
    return FlexDirection_COLUMN;
  } else if (atom == column_reverse_atom) {
    return FlexDirection_COLUMN_REVERSE;
  } else if (atom == row_atom) {
    return FlexDirection_ROW;
  } else if (atom == row_reverse_atom) {
    return FlexDirection_ROW_REVERSE;
  } else {
    return -1;
  }
}

JSAtom get_atom_from_flex_direction(FlexDirection direction) {
  if (direction == FlexDirection_COLUMN) {
    return column_atom;
  } else if (direction == FlexDirection_COLUMN_REVERSE) {
    return column_reverse_atom;
  } else if (direction == FlexDirection_ROW) {
    return row_atom;
  } else if (direction == FlexDirection_ROW_REVERSE) {
    return row_reverse_atom;
  } else {
    return JS_ATOM_NULL;
  }
}

ElementPositionType get_element_position_from_atom(JSAtom atom) {
  if (atom == relative_atom) {
    return ElementPositionType_RELATIVE;
  } else if (atom == absolute_atom) {
    return ElementPositionType_ABSOLUTE;
  } else {
    return -1;
  }
}

JSAtom get_atom_from_element_position(ElementPositionType position) {
  if (position == ElementPositionType_RELATIVE) {
    return relative_atom;
  } else if (position == ElementPositionType_ABSOLUTE) {
    return absolute_atom;
  } else {
    return JS_ATOM_NULL;
  }
}

JSAtom get_flex_align_from_atom(JSAtom atom) {
  if (atom == auto_atom) {
    return FlexAlign_AUTO;
  } else if (atom == flex_start_atom) {
    return FlexAlign_FLEX_START;
  } else if (atom == center_atom) {
    return FlexAlign_CENTER;
  } else if (atom == flex_end_atom) {
    return FlexAlign_FLEX_END;
  } else if (atom == stretch_atom) {
    return FlexAlign_STRETCH;
  } else if (atom == baseline_atom) {
    return FlexAlign_BASELINE;
  } else if (atom == space_between_atom) {
    return FlexAlign_SPACE_BETWEEN;
  } else if (atom == space_around_atom) {
    return FlexAlign_SPACE_AROUND;
  } else {
    return -1;
  }
}

FlexAlign get_atom_from_flex_align(FlexAlign align) {
  if (align == FlexAlign_AUTO) {
    return auto_atom;
  } else if (align == FlexAlign_FLEX_START) {
    return flex_start_atom;
  } else if (align == FlexAlign_CENTER) {
    return center_atom;
  } else if (align == FlexAlign_FLEX_END) {
    return flex_end_atom;
  } else if (align == FlexAlign_STRETCH) {
    return stretch_atom;
  } else if (align == FlexAlign_BASELINE) {
    return baseline_atom;
  } else if (align == FlexAlign_SPACE_BETWEEN) {
    return space_between_atom;
  } else if (align == FlexAlign_SPACE_AROUND) {
    return space_around_atom;
  } else {
    return JS_ATOM_NULL;
  }
}

FlexJustify get_flex_justify_from_atom(JSAtom atom) {
  if (atom == flex_start_atom) {
    return FlexJustify_FLEX_START;
  } else if (atom == center_atom) {
    return FlexJustify_CENTER;
  } else if (atom == flex_end_atom) {
    return FlexJustify_FLEX_END;
  } else if (atom == space_between_atom) {
    return FlexJustify_SPACE_BETWEEN;
  } else if (atom == space_around_atom) {
    return FlexJustify_SPACE_AROUND;
  } else if (atom == space_evenly_atom) {
    return FlexJustify_SPACE_EVENLY;
  } else {
    return -1;
  }
}

JSAtom get_atom_from_flex_justify(FlexJustify justify) {
  if (justify == FlexJustify_FLEX_START) {
    return flex_start_atom;
  } else if (justify == FlexJustify_CENTER) {
    return center_atom;
  } else if (justify == FlexJustify_FLEX_END) {
    return flex_end_atom;
  } else if (justify == FlexJustify_SPACE_BETWEEN) {
    return space_between_atom;
  } else if (justify == FlexJustify_SPACE_AROUND) {
    return space_around_atom;
  } else if (justify == FlexJustify_SPACE_EVENLY) {
    return space_evenly_atom;
  } else {
    return JS_ATOM_NULL;
  }
}

FlexWrap get_flex_wrap_from_atom(JSAtom atom) {
  if (atom == no_wrap_atom) {
    return FlexWrap_NO_WRAP;
  } else if (atom == wrap_atom) {
    return FlexWrap_WRAP;
  } else if (atom == wrap_reverse_atom) {
    return FlexWrap_WRAP_REVERSE;
  } else {
    return -1;
  }
}

JSAtom get_atom_from_flex_wrap(FlexWrap wrap) {
  if (wrap == FlexWrap_NO_WRAP) {
    return no_wrap_atom;
  } else if (wrap == FlexWrap_WRAP) {
    return wrap_atom;
  } else if (wrap == FlexWrap_WRAP_REVERSE) {
    return wrap_reverse_atom;
  } else {
    return JS_ATOM_NULL;
  }
}

/**
 * Class Definition
 **/

static void js_websg_ui_element_finalizer(JSRuntime *rt, JSValue val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(val);

  if (ui_element_data) {
    js_free_rt(rt, ui_element_data);
  }
}

static JSClassDef js_websg_ui_element_class = {
  "UIElement",
  .finalizer = js_websg_ui_element_finalizer
};

static JSValue js_websg_ui_element_get_flex_direction(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  FlexDirection result = websg_ui_element_get_flex_direction(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_flex_direction(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_flex_direction(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  FlexDirection value = get_flex_direction_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid flexDirection.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_flex_direction(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting flexDirection.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_position_type(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  ElementPositionType result = websg_ui_element_get_position_type(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_element_position(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_position_type(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  ElementPositionType value = get_element_position_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid position.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_position_type(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting position.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_position(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);
  float_t result = websg_ui_element_get_position_element(ui_element_data->ui_element_id, index);
  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_position(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_position_element(ui_element_data->ui_element_id, index, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting element position.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_align_content(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  FlexAlign result = websg_ui_element_get_align_content(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_flex_align(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_align_content(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  FlexAlign value = get_flex_align_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid alignContent.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_align_content(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting alignContent.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_align_items(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  FlexAlign result = websg_ui_element_get_align_items(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_flex_align(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_align_items(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  FlexAlign value = get_flex_align_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid alignItems.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_align_items(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting alignItems.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_align_self(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  FlexAlign result = websg_ui_element_get_align_self(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_flex_align(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_align_self(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  FlexAlign value = get_flex_align_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid alignSelf.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_align_self(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting alignSelf.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_flex_wrap(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  FlexWrap result = websg_ui_element_get_flex_wrap(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_flex_wrap(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_flex_wrap(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  FlexWrap value = get_flex_wrap_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid flexWrap.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_flex_wrap(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting flexWrap.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_flex_basis(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_flex_basis(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_flex_basis(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_flex_basis(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting flexBasis.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_flex_grow(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_flex_grow(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_flex_grow(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_flex_grow(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting flexGrow.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_flex_shrink(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_flex_shrink(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_flex_shrink(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_flex_shrink(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting flexShrink.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_justify_content(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  FlexJustify result = websg_ui_element_get_justify_content(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_flex_justify(result);

  return JS_AtomToString(ctx, atom);
}

static JSValue js_websg_ui_element_set_justify_content(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  JSAtom atom = JS_ValueToAtom(ctx, arg);

  FlexJustify value = get_flex_justify_from_atom(atom);

  if (value == -1) {
    JS_ThrowInternalError(ctx, "WebSG: invalid justifyContent.");
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_justify_content(ui_element_data->ui_element_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting justifyContent.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_width(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_width(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_width(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_width(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting width.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_height(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_height(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_height(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_height(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting height.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_min_width(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_min_width(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_min_width(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_min_width(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting minWidth.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_min_height(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_min_height(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_min_height(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_min_height(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting minHeight.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_max_width(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_max_width(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_max_width(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_max_width(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting maxWidth.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_max_height(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  float_t result = websg_ui_element_get_max_height(ui_element_data->ui_element_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_element_set_max_height(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_element_set_max_height(ui_element_data->ui_element_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting maxHeight.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  ui_element_id_t ui_element_id = ui_element_data->ui_element_id;

  WebSGUIElementData *child_data = JS_GetOpaque(argv[0], js_websg_ui_element_class_id);

  if (child_data == NULL) {
    child_data = JS_GetOpaque(argv[0], js_websg_ui_text_class_id);
  }

  if (child_data == NULL) {
    child_data = JS_GetOpaque(argv[0], js_websg_ui_button_class_id);
  }

  if (child_data == NULL) {
    JS_ThrowTypeError(ctx, "WebSG: Invalid child UIElement.");
    return JS_EXCEPTION;
  }

  if (websg_ui_element_add_child(ui_element_id, child_data->ui_element_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add child UIElement.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_ui_element_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  ui_element_id_t ui_element_id = ui_element_data->ui_element_id;

  WebSGUIElementData *child_data = JS_GetOpaque(argv[0], js_websg_ui_element_class_id);

  if (child_data == NULL) {
    child_data = JS_GetOpaque(argv[0], js_websg_ui_text_class_id);
  }

  if (child_data == NULL) {
    child_data = JS_GetOpaque(argv[0], js_websg_ui_button_class_id);
  }

  if (child_data == NULL) {
    JS_ThrowTypeError(ctx, "WebSG: Invalid child UIElement.");
    return JS_EXCEPTION;
  }

  if (websg_ui_element_remove_child(ui_element_id, child_data->ui_element_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove child UIElement.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_ui_element_get_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  ui_element_id_t child_id = websg_ui_element_get_child(ui_element_data->ui_element_id, index);

  if (child_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_ui_element_by_id(ctx, ui_element_data->world_data, child_id);
}


JSValue js_websg_ui_element_children(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  int32_t count = websg_ui_element_get_child_count(ui_element_data->ui_element_id);

  if (count == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting UIElement child count.");
    return JS_EXCEPTION;
  }

  ui_element_id_t *children = js_mallocz(ctx, sizeof(ui_element_id_t) * count);

  if (websg_ui_element_get_children(ui_element_data->ui_element_id, children, count) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting UIElement children.");
    return JS_EXCEPTION;
  }

  return js_websg_create_ui_element_iterator(ctx, ui_element_data->world_data, children, count);
}

static JSValue js_websg_ui_element_parent(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  ui_element_id_t ui_element_id = ui_element_data->ui_element_id;

  ui_element_id_t parent_id = websg_ui_element_get_parent(ui_element_id);

  if (parent_id != 0) {
    return js_websg_get_ui_element_by_id(ctx, ui_element_data->world_data, parent_id);
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_element_get_element_type(JSContext *ctx, JSValueConst this_val) {
  WebSGUIElementData *ui_element_data = JS_GetOpaque_UNSAFE(this_val);

  ElementType result = websg_ui_element_get_element_type(ui_element_data->ui_element_id);

  JSAtom atom = get_atom_from_element_type(result);

  return JS_AtomToString(ctx, atom);
}

static const JSCFunctionListEntry js_websg_ui_element_proto_funcs[] = {
  JS_CGETSET_DEF("position", js_websg_ui_element_get_position_type, js_websg_ui_element_set_position_type),
  JS_CGETSET_MAGIC_DEF("top", js_websg_ui_element_get_position, js_websg_ui_element_set_position, 0),
  JS_CGETSET_MAGIC_DEF("right", js_websg_ui_element_get_position, js_websg_ui_element_set_position, 1),
  JS_CGETSET_MAGIC_DEF("bottom", js_websg_ui_element_get_position, js_websg_ui_element_set_position, 2),
  JS_CGETSET_MAGIC_DEF("left", js_websg_ui_element_get_position, js_websg_ui_element_set_position, 3),
  JS_CGETSET_DEF("alignContent", js_websg_ui_element_get_align_content, js_websg_ui_element_set_align_content),
  JS_CGETSET_DEF("alignItems", js_websg_ui_element_get_align_items, js_websg_ui_element_set_align_items),
  JS_CGETSET_DEF("alignSelf", js_websg_ui_element_get_align_self, js_websg_ui_element_set_align_self),
  JS_CGETSET_DEF("flexDirection", js_websg_ui_element_get_flex_direction, js_websg_ui_element_set_flex_direction),
  JS_CGETSET_DEF("flexWrap", js_websg_ui_element_get_flex_wrap, js_websg_ui_element_set_flex_wrap),
  JS_CGETSET_DEF("flexBasis", js_websg_ui_element_get_flex_basis, js_websg_ui_element_set_flex_basis),
  JS_CGETSET_DEF("flexGrow", js_websg_ui_element_get_flex_grow, js_websg_ui_element_set_flex_grow),
  JS_CGETSET_DEF("flexShrink", js_websg_ui_element_get_flex_shrink, js_websg_ui_element_set_flex_shrink),
  JS_CGETSET_DEF("justifyContent", js_websg_ui_element_get_justify_content, js_websg_ui_element_set_justify_content),
  JS_CGETSET_DEF("width", js_websg_ui_element_get_width, js_websg_ui_element_set_width),
  JS_CGETSET_DEF("height", js_websg_ui_element_get_height, js_websg_ui_element_set_height),
  JS_CGETSET_DEF("minWidth", js_websg_ui_element_get_min_width, js_websg_ui_element_set_min_width),
  JS_CGETSET_DEF("minHeight", js_websg_ui_element_get_min_height, js_websg_ui_element_set_min_height),
  JS_CGETSET_DEF("maxWidth", js_websg_ui_element_get_max_width, js_websg_ui_element_set_max_width),
  JS_CGETSET_DEF("maxHeight", js_websg_ui_element_get_max_height, js_websg_ui_element_set_max_height),
  JS_CFUNC_DEF("addChild", 1, js_websg_ui_element_add_child),
  JS_CFUNC_DEF("removeChild", 1, js_websg_ui_element_remove_child),
  JS_CFUNC_DEF("getChild", 1, js_websg_ui_element_get_child),
  JS_CFUNC_DEF("children", 0, js_websg_ui_element_children),
  JS_CGETSET_DEF("parent", js_websg_ui_element_parent, NULL),
  JS_CGETSET_DEF("type", js_websg_ui_element_get_element_type, NULL),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "UIElement", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_ui_element_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_ui_element(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_ui_element_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_ui_element_class_id, &js_websg_ui_element_class);
  JSValue ui_element_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, ui_element_proto, js_websg_ui_element_proto_funcs, countof(js_websg_ui_element_proto_funcs));
  JS_SetClassProto(ctx, js_websg_ui_element_class_id, ui_element_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_ui_element_constructor,
    "UIElement",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, ui_element_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "UIElement",
    constructor
  );

  flex_atom = JS_NewAtom(ctx, "flex");
  text_atom = JS_NewAtom(ctx, "text");
  button_atom = JS_NewAtom(ctx, "button");
  column_atom = JS_NewAtom(ctx, "column");
  column_reverse_atom = JS_NewAtom(ctx, "column-reverse");
  row_atom = JS_NewAtom(ctx, "row");
  row_reverse_atom = JS_NewAtom(ctx, "row-reverse");
  relative_atom = JS_NewAtom(ctx, "relative");
  absolute_atom = JS_NewAtom(ctx, "absolute");
  auto_atom = JS_NewAtom(ctx, "auto");
  flex_start_atom = JS_NewAtom(ctx, "flex-start");
  center_atom = JS_NewAtom(ctx, "center");
  flex_end_atom = JS_NewAtom(ctx, "flex-end");
  stretch_atom = JS_NewAtom(ctx, "stretch");
  baseline_atom = JS_NewAtom(ctx, "baseline");
  space_between_atom = JS_NewAtom(ctx, "space-between");
  space_around_atom = JS_NewAtom(ctx, "space-around");
  space_evenly_atom = JS_NewAtom(ctx, "space-evenly");
  no_wrap_atom = JS_NewAtom(ctx, "no-wrap");
  wrap_atom = JS_NewAtom(ctx, "wrap");
  wrap_reverse_atom = JS_NewAtom(ctx, "wrap-reverse");

  JSValue element_type = JS_NewObject(ctx);
  JS_SetProperty(ctx, element_type, flex_atom, JS_AtomToValue(ctx, flex_atom));
  JS_SetProperty(ctx, element_type, text_atom, JS_AtomToValue(ctx, text_atom));
  JS_SetProperty(ctx, element_type, button_atom, JS_AtomToValue(ctx, button_atom));
  JS_SetPropertyStr(ctx, websg, "UIElementType", element_type);
}

void js_define_ui_element_props(
  JSContext *ctx,
  WebSGWorldData *world_data,
  ui_element_id_t ui_element_id,
  JSValue ui_element
) {
  js_websg_define_rgba_prop(
    ctx,
    ui_element,
    "backgroundColor",
    ui_element_id,
    &websg_ui_element_get_background_color_element,
    &websg_ui_element_set_background_color_element,
    &websg_ui_element_set_background_color
  );

  js_websg_define_rgba_prop(
    ctx,
    ui_element,
    "borderColor",
    ui_element_id,
    &websg_ui_element_get_border_color_element,
    &websg_ui_element_set_border_color_element,
    &websg_ui_element_set_border_color
  );

  js_websg_define_vector4_prop(
    ctx,
    ui_element,
    "padding",
    ui_element_id,
    &websg_ui_element_get_padding_element,
    &websg_ui_element_set_padding_element,
    &websg_ui_element_set_padding
  );

  js_websg_define_vector4_prop(
    ctx,
    ui_element,
    "margin",
    ui_element_id,
    &websg_ui_element_get_margin_element,
    &websg_ui_element_set_margin_element,
    &websg_ui_element_set_margin
  );

  js_websg_define_vector4_prop(
    ctx,
    ui_element,
    "borderWidth",
    ui_element_id,
    &websg_ui_element_get_border_width_element,
    &websg_ui_element_set_border_width_element,
    &websg_ui_element_set_border_width
  );

  js_websg_define_vector4_prop(
    ctx,
    ui_element,
    "borderRadius",
    ui_element_id,
    &websg_ui_element_get_border_radius_element,
    &websg_ui_element_set_border_radius_element,
    &websg_ui_element_set_border_radius
  );
}

JSValue js_websg_new_ui_element_instance(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t ui_element_id) {
  JSValue ui_element = JS_NewObjectClass(ctx, js_websg_ui_element_class_id);

  if (JS_IsException(ui_element)) {
    return ui_element;
  }

  js_define_ui_element_props(ctx, world_data, ui_element_id, ui_element);

  WebSGUIElementData *element_data = js_mallocz(ctx, sizeof(WebSGUIElementData));
  element_data->world_data = world_data;
  element_data->ui_element_id = ui_element_id;
  JS_SetOpaque(ui_element, element_data);

  JS_SetPropertyUint32(ctx, world_data->ui_elements, ui_element_id, JS_DupValue(ctx, ui_element));
  
  return ui_element;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_ui_element_by_id(JSContext *ctx, WebSGWorldData *world_data, ui_element_id_t ui_element_id) {
  JSValue ui_element = JS_GetPropertyUint32(ctx, world_data->ui_elements, ui_element_id);

  if (!JS_IsUndefined(ui_element)) {
    return JS_DupValue(ctx, ui_element);
  }

  ElementType type = websg_ui_element_get_element_type(ui_element_id);

  if (type == ElementType_FLEX) {
    return js_websg_new_ui_element_instance(ctx, world_data, ui_element_id);
  } else if (type == ElementType_TEXT) {
    return js_websg_new_ui_text_instance(ctx, world_data, ui_element_id);
  } else if (type == ElementType_BUTTON) {
    return js_websg_new_ui_button_instance(ctx, world_data, ui_element_id);
  } else {
    return JS_UNDEFINED;
  }
}

/**
 * World Methods
 **/

int js_websg_parse_ui_element_props(
  JSContext *ctx,
  WebSGWorldData *world_data,
  UIElementProps *props,
  JSValueConst arg
) {
  JSValue top_val = JS_GetPropertyStr(ctx, arg, "top");

  if (!JS_IsUndefined(top_val)) {
    double_t top;

    if (JS_ToFloat64(ctx, &top, top_val) == -1) {
      return -1;
    }

    props->position[0] = (float_t)top;
  }

  JSValue right_val = JS_GetPropertyStr(ctx, arg, "right");

  if (!JS_IsUndefined(right_val)) {
    double_t right;

    if (JS_ToFloat64(ctx, &right, right_val) == -1) {
      return -1;
    }

    props->position[1] = (float_t)right;
  }

  JSValue bottom_val = JS_GetPropertyStr(ctx, arg, "bottom");

  if (!JS_IsUndefined(bottom_val)) {
    double_t bottom;

    if (JS_ToFloat64(ctx, &bottom, bottom_val) == -1) {
      return -1;
    }

    props->position[2] = (float_t)bottom;
  }

  JSValue left_val = JS_GetPropertyStr(ctx, arg, "left");

  if (!JS_IsUndefined(left_val)) {
    double_t left;

    if (JS_ToFloat64(ctx, &left, left_val) == -1) {
      return -1;
    }

    props->position[3] = (float_t)left;
  }

  JSValue position_val = JS_GetPropertyStr(ctx, arg, "position");

  if (!JS_IsUndefined(position_val)) {
    ElementPositionType position_type = get_element_position_from_atom(JS_ValueToAtom(ctx, position_val));

    if (position_type == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid position type");
      return -1;
    }

    props->position_type = position_type;
  }

  JSValue align_content_val = JS_GetPropertyStr(ctx, arg, "alignContent");

  if (!JS_IsUndefined(align_content_val)) {
    FlexAlign align_content = get_flex_align_from_atom(JS_ValueToAtom(ctx, align_content_val));

    if (align_content == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid alignContent type");
      return -1;
    }

    props->align_content = align_content;
  }

  JSValue align_items_val = JS_GetPropertyStr(ctx, arg, "alignItems");

  if (!JS_IsUndefined(align_items_val)) {
    FlexAlign align_items = get_flex_align_from_atom(JS_ValueToAtom(ctx, align_items_val));

    if (align_items == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid alignItems type");
      return -1;
    }

    props->align_items = align_items;
  }

  JSValue align_self_val = JS_GetPropertyStr(ctx, arg, "alignSelf");

  if (!JS_IsUndefined(align_self_val)) {
    FlexAlign align_self = get_flex_align_from_atom(JS_ValueToAtom(ctx, align_self_val));

    if (align_self == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid alignSelf type");
      return -1;
    }

    props->align_self = align_self;
  }

  JSValue flex_direction_val = JS_GetPropertyStr(ctx, arg, "flexDirection");

  if (!JS_IsUndefined(flex_direction_val)) {
    FlexDirection flex_direction = get_flex_direction_from_atom(JS_ValueToAtom(ctx, flex_direction_val));

    if (flex_direction == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid flexDirection type");
      return -1;
    }

    props->flex_direction = flex_direction;
  }

  JSValue flex_wrap_val = JS_GetPropertyStr(ctx, arg, "flexWrap");

  if (!JS_IsUndefined(flex_wrap_val)) {
    FlexWrap flex_wrap = get_flex_wrap_from_atom(JS_ValueToAtom(ctx, flex_wrap_val));

    if (flex_wrap == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid flexWrap type");
      return -1;
    }

    props->flex_wrap = flex_wrap;
  }

  JSValue flex_basis_val = JS_GetPropertyStr(ctx, arg, "flexBasis");

  if (!JS_IsUndefined(flex_basis_val)) {
    double_t flex_basis;

    if (JS_ToFloat64(ctx, &flex_basis, flex_basis_val) == -1) {
      return -1;
    }

    props->flex_basis = (float_t)flex_basis;
  }

  JSValue flex_grow_val = JS_GetPropertyStr(ctx, arg, "flexGrow");

  if (!JS_IsUndefined(flex_grow_val)) {
    double_t flex_grow;

    if (JS_ToFloat64(ctx, &flex_grow, flex_grow_val) == -1) {
      return -1;
    }

    props->flex_grow = (float_t)flex_grow;
  }

  JSValue flex_shrink_val = JS_GetPropertyStr(ctx, arg, "flexShrink");

  if (!JS_IsUndefined(flex_shrink_val)) {
    double_t flex_shrink;

    if (JS_ToFloat64(ctx, &flex_shrink, flex_shrink_val) == -1) {
      return -1;
    }

    props->flex_shrink = (float_t)flex_shrink;
  }

  JSValue justify_content_val = JS_GetPropertyStr(ctx, arg, "justifyContent");

  if (!JS_IsUndefined(justify_content_val)) {
    FlexJustify justify_content = get_flex_justify_from_atom(JS_ValueToAtom(ctx, justify_content_val));

    if (justify_content == -1) {
      JS_ThrowTypeError(ctx, "WebSG: Invalid justifyContent type");
      return -1;
    }

    props->justify_content = justify_content;
  }

  JSValue width_val = JS_GetPropertyStr(ctx, arg, "width");

  if (!JS_IsUndefined(width_val)) {
    double_t width;

    if (JS_ToFloat64(ctx, &width, width_val) == -1) {
      return -1;
    }

    props->width = (float_t)width;
  }

  JSValue height_val = JS_GetPropertyStr(ctx, arg, "height");

  if (!JS_IsUndefined(height_val)) {
    double_t height;

    if (JS_ToFloat64(ctx, &height, height_val) == -1) {
      return -1;
    }

    props->height = (float_t)height;
  }

  JSValue min_width_val = JS_GetPropertyStr(ctx, arg, "minWidth");

  if (!JS_IsUndefined(min_width_val)) {
    double_t min_width;

    if (JS_ToFloat64(ctx, &min_width, min_width_val) == -1) {
      return -1;
    }

    props->min_width = (float_t)min_width;
  }

  JSValue min_height_val = JS_GetPropertyStr(ctx, arg, "minHeight");

  if (!JS_IsUndefined(min_height_val)) {
    double_t min_height;

    if (JS_ToFloat64(ctx, &min_height, min_height_val) == -1) {
      return -1;
    }

    props->min_height = (float_t)min_height;
  }

  JSValue max_width_val = JS_GetPropertyStr(ctx, arg, "maxWidth");

  if (!JS_IsUndefined(max_width_val)) {
    double_t max_width;

    if (JS_ToFloat64(ctx, &max_width, max_width_val) == -1) {
      return -1;
    }

    props->max_width = (float_t)max_width;
  }

  JSValue max_height_val = JS_GetPropertyStr(ctx, arg, "maxHeight");

  if (!JS_IsUndefined(max_height_val)) {
    double_t max_height;

    if (JS_ToFloat64(ctx, &max_height, max_height_val) == -1) {
      return -1;
    }

    props->max_height = (float_t)max_height;
  }

  JSValue background_color_val = JS_GetPropertyStr(ctx, arg, "backgroundColor");

  if (!JS_IsUndefined(background_color_val)) {
    if (js_get_float_array_like(ctx, background_color_val, props->background_color, 4) < 0) {
      return -1;
    }
  }

  JSValue border_color_val = JS_GetPropertyStr(ctx, arg, "borderColor");

  if (!JS_IsUndefined(border_color_val)) {
    if (js_get_float_array_like(ctx, border_color_val, props->border_color, 4) < 0) {
      return -1;
    }
  }

  JSValue padding_val = JS_GetPropertyStr(ctx, arg, "padding");

  if (!JS_IsUndefined(padding_val)) {
    if (js_get_float_array_like(ctx, padding_val, props->padding, 4) < 0) {
      return -1;
    }
  }

  JSValue margin_val = JS_GetPropertyStr(ctx, arg, "margin");

  if (!JS_IsUndefined(margin_val)) {
    if (js_get_float_array_like(ctx, margin_val, props->margin, 4) < 0) {
      return -1;
    }
  }

  JSValue border_width_val = JS_GetPropertyStr(ctx, arg, "borderWidth");

  if (!JS_IsUndefined(border_width_val)) {
    if (js_get_float_array_like(ctx, border_width_val, props->border_width, 4) < 0) {
      return -1;
    }
  }

  JSValue border_radius_val = JS_GetPropertyStr(ctx, arg, "borderRadius");

  if (!JS_IsUndefined(border_radius_val)) {
    if (js_get_float_array_like(ctx, border_radius_val, props->border_radius, 4) < 0) {
      return -1;
    }
  }

  return 0;
}

JSValue js_websg_world_create_ui_element(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  UIElementProps *props = js_mallocz(ctx, sizeof(UIElementProps));

  props->type = ElementType_FLEX;
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

  if (js_websg_parse_ui_element_props(ctx, world_data, props, argv[0]) < 0) {
    return JS_EXCEPTION;
  }

  ui_element_id_t ui_element_id = websg_world_create_ui_element(props);

  if (ui_element_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UIElement.");
    return JS_EXCEPTION;
  }

  return js_websg_new_ui_element_instance(ctx, world_data, ui_element_id);
}

JSValue js_websg_world_find_ui_element_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  ui_element_id_t ui_element_id = websg_world_find_ui_element_by_name(name, length);

  if (ui_element_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_ui_element_by_id(ctx, world_data, ui_element_id);
}