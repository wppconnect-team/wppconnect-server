#!/bin/sh
set -e

USER_DATA_DIR="${CUSTOM_USER_DATA_DIR:-/usr/src/wpp-server/userDataDir}"

echo "Cleaning stale Chromium lock files from ${USER_DATA_DIR}..."

if [ -d "$USER_DATA_DIR" ]; then
  find "$USER_DATA_DIR" -name "Singleton*" -print -exec rm -rf {} +
fi

echo "🚀 Starting WPPConnect..."

exec node dist/server.js