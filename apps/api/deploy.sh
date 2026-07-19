#!/usr/bin/env bash
# GitHub Actions가 SSH로 VPS에 접속해 실행
set -euo pipefail

cd /home/deploy/storytrope
git pull --ff-only origin main

cd apps/api
docker compose up -d --build
