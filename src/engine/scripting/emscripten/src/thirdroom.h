#ifndef __thirdroom_h
#define __thirdroom_h
#include <math.h>
#include <stdint.h>
#include "./websg.h"

#define import_thirdroom(NAME) __attribute__((import_module("thirdroom"),import_name(#NAME)))

typedef uint32_t action_bar_listener_id_t;

import_thirdroom(get_js_source_size) int32_t thirdroom_get_js_source_size();
import_thirdroom(get_js_source) int32_t thirdroom_get_js_source(char *ptr);

import_thirdroom(enable_matrix_material) void thirdroom_enable_matrix_material(int enabled);

import_thirdroom(get_audio_data_size) int32_t thirdroom_get_audio_data_size();
import_thirdroom(get_audio_frequency_data) int32_t thirdroom_get_audio_frequency_data(uint8_t *data);
import_thirdroom(get_audio_time_data) int32_t thirdroom_get_audio_time_data(uint8_t *data);

import_thirdroom(in_ar) int32_t thirdroom_in_ar();

typedef struct ThirdRoomActionBarItem {
  const char *id;
  const char *label;
  image_id_t thumbnail_id;
} ThirdRoomActionBarItem;

typedef struct ThirdRoomActionBarItemList {
  ThirdRoomActionBarItem *items;
  int32_t count;
} ThirdRoomActionBarItemList;

import_thirdroom(action_bar_set_items) int32_t thirdroom_action_bar_set_items(ThirdRoomActionBarItemList *items);

import_thirdroom(action_bar_create_listener) action_bar_listener_id_t thirdroom_action_bar_create_listener();

import_thirdroom(action_bar_listener_dispose) int32_t thirdroom_action_bar_listener_dispose(action_bar_listener_id_t listener_id);

import_thirdroom(action_bar_listener_get_next_action_length) int32_t thirdroom_action_bar_listener_get_next_action_length(action_bar_listener_id_t listener_id);

import_thirdroom(action_bar_listener_get_next_action) int32_t thirdroom_action_bar_listener_get_next_action(action_bar_listener_id_t listener_id, const char *id);

#endif
