#!/bin/bash

# Build frontend
cd frontend
yarn
yarn run build

cd ..

# Set env vars
set -a
. ./.env
set +a

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