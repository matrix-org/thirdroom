#!/bin/sh

cd $(dirname $0)

./interactable/c/build.sh
./matrix/c/build.sh
./procgen/c/build.sh
./widget-hello-world/c/build.sh