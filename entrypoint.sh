#!/bin/sh
set -eu

USER_DATA_DIR="${CUSTOM_USER_DATA_DIR:-/usr/src/wpp-server/userDataDir}"
OWNER_LOCK="$USER_DATA_DIR/.entrypoint.lock"

# Chromium's SingletonLock target is hostname-pid, which is meaningless across
# containers (new hostname, new PID namespace). Hold a kernel flock on the
# profile directory for the whole life of the server: if we get it, no other
# live entrypoint uses this directory, so leftover Singleton* files are stale.
if [ -d "$USER_DATA_DIR" ]; then
  if ! command -v flock >/dev/null 2>&1; then
    echo "entrypoint: flock not found; skipping stale lock cleanup" >&2
  elif ! touch "$OWNER_LOCK" 2>/dev/null; then
    echo "entrypoint: cannot write $OWNER_LOCK; skipping stale lock cleanup" >&2
  else
    exec 9>"$OWNER_LOCK"
    if flock -n 9; then
      find "$USER_DATA_DIR" -type l \
        \( -name SingletonLock -o -name SingletonSocket -o -name SingletonCookie \) \
        -print -delete
    else
      echo "entrypoint: $USER_DATA_DIR is in use by another live container; not touching Singleton* files" >&2
    fi
  fi
fi

exec node dist/server.js "$@"