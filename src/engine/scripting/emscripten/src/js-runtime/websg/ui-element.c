#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./ui-flex.h"
#include "./rgba.h"
#include "./vector4.h"

/**
 * Class Definition
 **/

static void js_websg_ui_flex_finalizer(JSRuntime *rt, JSValue val) {
  WebSGUIFlexData *ui_flex_data = JS_GetOpaque(val, js_websg_ui_flex_class_id);

  if (ui_flex_data) {
    js_free_rt(rt, ui_flex_data);
  }
}

static JSClassDef js_websg_ui_flex_class = {
  "UIFlex",
  .finalizer = js_websg_ui_flex_finalizer
};

static JSValue js_websg_ui_flex_get_width(JSContext *ctx, JSValueConst this_val) {
 WebSGUIFlexData *ui_flex_data = JS_GetOpaque(this_val, js_websg_ui_flex_class_id);

  float_t result = websg_ui_flex_get_width(ui_flex_data->ui_flex_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_flex_set_width(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIFlexData *ui_flex_data = JS_GetOpaque(this_val, js_websg_ui_flex_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_flex_set_width(ui_flex_data->ui_flex_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting width.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_flex_get_height(JSContext *ctx, JSValueConst this_val) {
 WebSGUIFlexData *ui_flex_data = JS_GetOpaque(this_val, js_websg_ui_flex_class_id);

  float_t result = websg_ui_flex_get_height(ui_flex_data->ui_flex_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_websg_ui_flex_set_height(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGUIFlexData *ui_flex_data = JS_GetOpaque(this_val, js_websg_ui_flex_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_ui_flex_set_height(ui_flex_data->ui_flex_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting height.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_ui_flex_redraw(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGUIFlexData *ui_flex_data = JS_GetOpaque(this_val, js_websg_ui_flex_class_id);
  
  int32_t result = websg_ui_flex_redraw(ui_flex_data->ui_flex_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error redrawing UI canvas.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_ui_flex_proto_funcs[] = {
  JS_CGETSET_DEF("flexDirection", js_websg_ui_flex_get_flex_direction, js_websg_ui_flex_set_flex_direction),
  JS_CGETSET_DEF("width", js_websg_ui_flex_get_width, js_websg_ui_flex_set_width),
  JS_CGETSET_DEF("height", js_websg_ui_flex_get_height, js_websg_ui_flex_set_height),
  JS_CFUNC_DEF("addChild", 1, js_websg_ui_flex_add_child),
  JS_CFUNC_DEF("removeChild", 1, js_websg_ui_flex_remove_child),
  JS_CFUNC_DEF("getChild", 1, js_websg_ui_flex_get_child),
  JS_CFUNC_DEF("children", 0, js_websg_ui_flex_children),
  JS_CGETSET_DEF("parent", js_websg_ui_flex_parent, NULL),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "UIFlex", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_ui_flex_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_ui_flex(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_ui_flex_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_ui_flex_class_id, &js_websg_ui_flex_class);
  JSValue ui_flex_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, ui_flex_proto, js_websg_ui_flex_proto_funcs, countof(js_websg_ui_flex_proto_funcs));
  JS_SetClassProto(ctx, js_websg_ui_flex_class_id, ui_flex_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_ui_flex_constructor,
    "UIFlex",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, ui_flex_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "UIFlex",
    constructor
  );
}

JSValue js_websg_new_ui_flex_instance(JSContext *ctx, WebSGWorldData *world_data, ui_flex_id_t ui_flex_id) {
  JSValue ui_flex = JS_NewObjectClass(ctx, js_websg_ui_flex_class_id);

  if (JS_IsException(ui_flex)) {
    return ui_flex;
  }

  js_websg_define_rgba_prop(
    ctx,
    ui_flex,
    "backgroundColor",
    ui_flex_id,
    &js_websg_material_get_background_color_element,
    &js_websg_material_set_background_color_element
  );

  js_websg_define_rgba_prop(
    ctx,
    ui_flex,
    "borderColor",
    ui_flex_id,
    &js_websg_material_get_border_color_element,
    &js_websg_material_set_border_color_element
  );

  js_websg_define_vector4_prop(
    ctx,
    ui_flex,
    "padding",
    ui_flex_id,
    &js_websg_material_get_padding_element,
    &js_websg_material_set_padding_element
  );

  js_websg_define_vector4_prop(
    ctx,
    ui_flex,
    "margin",
    ui_flex_id,
    &js_websg_material_get_margin_element,
    &js_websg_material_set_margin_element
  );

  WebSGUIFlexData *ui_flex_data = js_mallocz(ctx, sizeof(WebSGUIFlexData));
  ui_flex_data->world_data = world_data;
  ui_flex_data->ui_flex_id = ui_flex_id;
  JS_SetOpaque(ui_flex, ui_flex_data);

  JS_SetPropertyUint32(ctx, world_data->ui_flexes, ui_flex_id, JS_DupValue(ctx, ui_flex));
  
  return ui_flex;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_ui_flex_by_id(JSContext *ctx, WebSGWorldData *world_data, ui_flex_id_t ui_flex_id) {
  JSValue ui_flex = JS_GetPropertyUint32(ctx, world_data->ui_flexes, ui_flex_id);

  if (!JS_IsUndefined(ui_flex)) {
    return JS_DupValue(ctx, ui_flex);
  }

  return js_websg_new_ui_flex_instance(ctx, world_data, ui_flex_id);
}

/**
 * World Methods
 **/

static JSValue js_websg_world_create_ui_flex(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

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
    if (js_get_float_array_like(ctx, background_color_val, props->background_color, 4) < 0) {
      return JS_EXCEPTION;
    }
  }

  JSValue border_color_val = JS_GetPropertyStr(ctx, argv[0], "borderColor");

  if (!JS_IsUndefined(border_color_val)) {
    if (js_get_float_array_like(ctx, border_color_val, props->border_color, 4) < 0) {
      return JS_EXCEPTION;
    }
  }

  JSValue padding_val = JS_GetPropertyStr(ctx, argv[0], "padding");

  if (!JS_IsUndefined(padding_val)) {
    if (js_get_float_array_like(ctx, padding_val, props->padding, 4) < 0) {
      return JS_EXCEPTION;
    }
  }

  JSValue margin_val = JS_GetPropertyStr(ctx, argv[0], "margin");

  if (!JS_IsUndefined(margin_val)) {
    if (js_get_float_array_like(ctx, margin_val, props->margin, 4) < 0) {
      return JS_EXCEPTION;
    }
  }

  ui_flex_id_t flex_id = websg_ui_create_flex(props);

  if (flex_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UI flex.");
    return JS_EXCEPTION;
  }

  ui_flex_id_t ui_flex_id = websg_create_ui_flex(props);

  if (ui_flex_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG UI: Error creating UI canvas.");
    return JS_EXCEPTION;
  }

  return js_websg_new_ui_flex_instance(ctx, world_data, ui_flex_id);
}
