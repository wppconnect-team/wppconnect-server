#!/bin/sh
set -eu

USER_DATA_DIR="${CUSTOM_USER_DATA_DIR:-/usr/src/wpp-server/userDataDir}"

# Chromium's lock target is hostname-pid. Only remove a verified dead local
# owner; a different host may still be using a shared browser profile.
if [ -d "$USER_DATA_DIR" ]; then
  find "$USER_DATA_DIR" -type l -name SingletonLock -exec sh -c '
    lock=$1
    owner=$(readlink "$lock")
    owner_host=${owner%-*}
    owner_pid=${owner##*-}
    case "$owner_pid" in ""|*[!0-9]*) exit 0 ;; esac
    [ "$owner_host" = "$(hostname)" ] || exit 0
    # A /proc entry also protects live owners inaccessible to kill -0.
    [ ! -d "/proc/$owner_pid" ] || exit 0
    if kill -0 "$owner_pid" 2>/dev/null; then exit 0; fi
    profile=${lock%/*}
    rm -f -- "$profile/SingletonLock" "$profile/SingletonSocket" "$profile/SingletonCookie"
  ' sh {} \;
fi

exec node dist/server.js "$@"
