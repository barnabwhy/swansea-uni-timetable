#!/bin/bash

nobuild="nobuild"
if [[ "$1" != "$nobuild" ]]; then
    # Build frontend
    cd frontend
    yarn
    yarn run build

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
yarn

dev="dev"
if [[ "$1" == "$dev" ]]; then
    export NODE_ENV="dev"
    yarn run start\:dev
else
    yarn run start
fi