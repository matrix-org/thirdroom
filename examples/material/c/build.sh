#!/bin/bash

mkdir -p ./build

emcc \
  -O3 \
  --no-entry \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s INITIAL_MEMORY=67108864 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -Wl,--import-memory \
  -o ./build/material-example.wasm \
  src/*.c \
