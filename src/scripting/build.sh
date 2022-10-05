#!/bin/bash

QUICKJS_ROOT=include/quickjs
QUICKJS_CONFIG_VERSION=$(cat $QUICKJS_ROOT/VERSION)

emcc \
  -O0 \
  --no-entry \
  --emit-symbol-map \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s INITIAL_MEMORY=16777216 \
  -s MALLOC=emmalloc \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXIT_RUNTIME=1 \
  -s ENVIRONMENT='worker' \
  -s EXPORT_NAME="ScriptingRuntimeModule" \
  -s EXPORTED_RUNTIME_METHODS="allocateUTF8,exitJS" \
  -o ./build/scripting-runtime.js \
  -D_GNU_SOURCE \
  -DCONFIG_VERSION=\"$QUICKJS_CONFIG_VERSION\" \
  -DCONFIG_STACK_CHECK \
  src/*.c \
  include/quickjs/{quickjs,cutils,libregexp,libunicode}.c
