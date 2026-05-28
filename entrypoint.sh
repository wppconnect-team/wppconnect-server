#!/bin/sh

echo "🧹 Limpando locks do Chromium..."

# Remove locks que causam conflito
find /data/userDataDir -name "Singleton*" -exec rm -rf {} + 2>/dev/null

echo "🚀 Iniciando WPPConnect..."

node dist/server.js
