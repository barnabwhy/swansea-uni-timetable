#!/bin/bash

# Build frontend
cd frontend
yarn run build

cd ..

# Set env vars
set -a
. ./.env
set +a

# Serve backend & frontend
cd backend

dev="dev"
if [[ "$1" == "$dev" ]]; then
    yarn run start\:dev
else
    yarn run start
fi