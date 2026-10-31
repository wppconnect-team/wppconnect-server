#!/bin/sh
set -eu

USER_DATA_DIR="${CUSTOM_USER_DATA_DIR:-/usr/src/wpp-server/userDataDir}"
OWNER_LOCK="$USER_DATA_DIR/.entrypoint.lock"
MANAGED_MARKER="$USER_DATA_DIR/.entrypoint.managed"

# 1. Create the profile directory BEFORE anything else, so the lock below
#    always exists, even on the very first start.
mkdir -p "$USER_DATA_DIR"

# 2. flock is required. Without it we cannot prove who owns the directory,
#    so we refuse to start instead of guessing.
if ! command -v flock >/dev/null 2>&1; then
  echo "entrypoint: flock not found; refusing to start" >&2
  exit 1
fi

# 3. Take exclusive ownership of the profile directory. File descriptor 9 stays
#    open for the whole life of the server (node and Chromium inherit it).
#    If another live entrypoint already owns it, stop here.
exec 9>"$OWNER_LOCK"
if ! flock -n 9; then
  echo "entrypoint: $USER_DATA_DIR is in use by another live container; refusing to start" >&2
  exit 1
fi

# 4. Look for leftover Chromium Singleton* symlinks.
STALE="$(find "$USER_DATA_DIR" -type l \
  \( -name SingletonLock -o -name SingletonSocket -o -name SingletonCookie \) -print)"

if [ -n "$STALE" ]; then
  # Migration rule: holding the lock only proves that no NEW-style entrypoint
  # is alive. A browser started by an OLD entrypoint never took this lock.
  # So we only delete when a previous new-style entrypoint already managed this
  # directory (marker exists), or when the operator explicitly forces it.
  if [ -f "$MANAGED_MARKER" ] || [ "${FORCE_CLEAN_CHROMIUM_LOCKS:-0}" = "1" ]; then
    echo "$STALE" | while IFS= read -r f; do
      echo "entrypoint: removing stale $f"
      rm -f "$f"
    done
  else
    echo "entrypoint: found Singleton* files but cannot prove their owner is dead" >&2
    echo "entrypoint: (directory was not managed by this entrypoint before)." >&2
    echo "entrypoint: stop any old container using it, or set FORCE_CLEAN_CHROMIUM_LOCKS=1" >&2
    exit 1
  fi
fi

# 5. Mark the directory as managed by this entrypoint.
touch "$MANAGED_MARKER"

exec node dist/server.js "$@"