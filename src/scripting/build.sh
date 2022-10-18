#!/bin/bash

QUICKJS_ROOT=include/quickjs
QUICKJS_CONFIG_VERSION=$(cat $QUICKJS_ROOT/VERSION)

emcc \
  -O2 \
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

../../node_modules/.bin/wasm2wat ./build/scripting-runtime.wasm -o ./build/scripting-runtime.wat

sed \
  -i '' \
    's/(import "env" "memory" (memory (;0;) 256 256))/(import "env" "memory" (memory (;0;) 256 256 shared))/g' \
    ./build/scripting-runtime.wat

../../node_modules/.bin/wat2wasm --enable-threads ./build/scripting-runtime.wat -o ./build/scripting-runtime.wasm