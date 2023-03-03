#!/bin/bash

cd $(dirname $0)

docker run \
  --rm \
  -v $(pwd):/src \
  -u $(id -u):$(id -g) \
  emscripten/emsdk:3.1.23 \
  ./build.sh
