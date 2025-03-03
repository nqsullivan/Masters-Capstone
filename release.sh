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
cd - > /dev/null

cd release
zip -r release.zip . -x "release.zip"
cd - > /dev/null

if [ -z "$RPI_HOST" ]; then
    read -p "Enter Raspberry Pi hostname (or IP): " RPI_HOST
fi

if [ -z "$RPI_USER" ]; then
    read -p "Enter Raspberry Pi username: " RPI_USER
fi

nc -z -w5 "$RPI_HOST" 22 || { echo "Raspberry Pi is not reachable"; exit 1; }

scp release/release.zip "$RPI_USER@$RPI_HOST":~/release.zip

ssh "$RPI_USER@$RPI_HOST" << 'EOF'
    rm -rf ~/release
    mkdir -p ~/release
    unzip -o ~/release.zip -d ~/release
    cd ~/release
    docker compose down
    docker compose build
    docker compose up -d
    rm ~/release.zip
EOF

echo "Deployment completed successfully!"
