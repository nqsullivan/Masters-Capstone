#!/bin/bash

set -e

release_dir="./release"

prepare_release_dir() {
    cd "$release_dir"
    git clean -fdx --exclude=.env
    cd - > /dev/null
}

build_and_copy() {
    local component_dir=$1
    local build_command=$2
    local install_command=$3
    local source_dir=$4
    local target_dir=$5

    cd "$component_dir"
    eval "$install_command"
    eval "$build_command"
    cp -r "$source_dir" "$target_dir"
    cd - > /dev/null
}

prepare_release_dir

build_and_copy "client" "npm run build" "npm ci" "dist/client" "../release"
build_and_copy "server" "npm run build" "npm ci" "dist/server" "../release"

rsync -a --delete controller/ "$release_dir/controller" --exclude=".git"

tar --disable-copyfile --no-xattrs -czf release/release.tar.gz -C release .

if [ -z "$RPI_HOST" ]; then
    read -p "Enter Raspberry Pi hostname (or IP): " RPI_HOST
fi

if [ -z "$RPI_USER" ]; then
    read -p "Enter Raspberry Pi username: " RPI_USER
fi

nc -z -w5 "$RPI_HOST" 22 || { echo "Raspberry Pi is not reachable"; exit 1; }

scp -C release/release.tar.gz "$RPI_USER@$RPI_HOST":~/release.tar.gz

ssh "$RPI_USER@$RPI_HOST" << 'EOF'
    rm -rf ~/release
    mkdir -p ~/release
    tar -xzf ~/release.tar.gz -C ~/release

    cd ~/release

    docker compose pull
    docker compose down
    docker compose build
    docker compose --env-file .env up -d

    cd controller
    rm -rf venv
    python3 -m venv venv --system-site-packages
    source venv/bin/activate
    pip install --upgrade pip
    pip install --no-cache-dir -r requirements.txt

    pkill -f main.py || true
    nohup ./start.sh > controller.log 2>&1 &

    cd ~
    rm ~/release.tar.gz
EOF

echo "Deployment completed successfully!"
