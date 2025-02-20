#!/bin/bash

set -e

release_dir="./release"

prepare_release_dir() {
    cd "$release_dir"
    git clean -fdx
    cd - > /dev/null
}

build_and_copy() {
    local component_dir=$1
    local build_command=$2
    local source_dir=$3
    local target_dir=$4

    cd "$component_dir"
    eval "$build_command"
    cp -r "$source_dir" "$target_dir"
    cd - > /dev/null
}

prepare_release_dir

build_and_copy "client" "npm run build" "dist/client" "../release"
build_and_copy "server" "npm run build" "dist/server" "../release"

cd controller
mkdir -p ../release/controller
cp main.py ../release/controller
cp -r src ../release/controller
cp requirements.txt ../release/controller
cp Dockerfile ../release/controller

cd ../release
zip -r release.zip . -x "release.zip"

cd - > /dev/null
