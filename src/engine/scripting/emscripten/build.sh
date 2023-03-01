#!/bin/bash

cd $(dirname $0)

QUICKJS_ROOT=src/js-runtime/quickjs
QUICKJS_CONFIG_VERSION=$(cat $QUICKJS_ROOT/VERSION)

emcc \
  -O2 \
  -g \
  --no-entry \
  --emit-symbol-map \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s INITIAL_MEMORY=67108864 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -Wl,--import-memory \
  -o ./build/scripting-runtime.wasm \
  -D_GNU_SOURCE \
  -DCONFIG_VERSION=\"$QUICKJS_CONFIG_VERSION\" \
  -DCONFIG_STACK_CHECK \
  src/js-runtime/*.c \
  src/js-runtime/quickjs/{quickjs,cutils,libregexp,libunicode}.c
