#!/bin/bash

QUICKJS_ROOT=include/quickjs
QUICKJS_CONFIG_VERSION=$(cat $QUICKJS_ROOT/VERSION)

emcc \
  -O2 \
  -g \
  --no-entry \
  --emit-symbol-map \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s INITIAL_MEMORY=16777216 \
  -s MALLOC=emmalloc \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -Wl,--import-memory \
  -o ./build/scripting-runtime.wasm \
  -D_GNU_SOURCE \
  -DCONFIG_VERSION=\"$QUICKJS_CONFIG_VERSION\" \
  -DCONFIG_STACK_CHECK \
  src/*.c \
  include/quickjs/{quickjs,cutils,libregexp,libunicode}.c
