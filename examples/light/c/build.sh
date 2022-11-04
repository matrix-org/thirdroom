#!/bin/bash

mkdir -p ./build

emcc \
  -O3 \
  --no-entry \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s INITIAL_MEMORY=16777216 \
  -s MALLOC=emmalloc \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -Wl,--import-memory \
  -o ./build/light-example.wasm \
  src/*.c \
