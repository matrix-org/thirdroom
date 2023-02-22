#ifndef __thirdroom_h
#define __thirdroom_h
#include <math.h>
#include <stdint.h>

#define import_thirdroom(NAME) __attribute__((import_module("thirdroom"),import_name(#NAME)))

import_thirdroom(get_js_source_size) int32_t thirdroom_get_js_source_size();
import_thirdroom(get_js_source) int32_t thirdroom_get_js_source(char *ptr);

import_thirdroom(enable_matrix_material) void thirdroom_enable_matrix_material(int enabled);

import_thirdroom(get_audio_data_size) int32_t thirdroom_get_audio_data_size();
import_thirdroom(get_audio_frequency_data) int32_t thirdroom_get_audio_frequency_data(uint8_t *data);
import_thirdroom(get_audio_time_data) int32_t thirdroom_get_audio_time_data(uint8_t *data);

#endif
