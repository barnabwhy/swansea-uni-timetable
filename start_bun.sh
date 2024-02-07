#!/bin/bash

nobuild="nobuild"
if [ "$1" != "$nobuild" ]; then
    # Build frontend
    cd frontend
    bun install
    bunx --bun vite build

    cd ..
fi

# Set env vars
if test -f ./.env; then
    set -a
    . ./.env
    set +a
fi

# Serve backend & frontend
cd backend
bun install

dev="dev"
if [ "$1" = "$dev" ]; then
    export NODE_ENV="dev"
    bun run src/main.ts --watch 
else
    bun run src/main.ts
fi