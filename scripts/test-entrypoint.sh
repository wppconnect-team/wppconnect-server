#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT HUP INT TERM
mkdir -p "$test_dir/bin" "$test_dir/profiles/dead" "$test_dir/profiles/live" "$test_dir/profiles/remote" "$test_dir/profiles/unknown"
printf '#!/bin/sh\nexit 0\n' > "$test_dir/bin/node"
chmod +x "$test_dir/bin/node"
ln -s "$(hostname)-99999999" "$test_dir/profiles/dead/SingletonLock"
ln -s "$(hostname)-$$" "$test_dir/profiles/live/SingletonLock"
ln -s 'another-host-99999999' "$test_dir/profiles/remote/SingletonLock"
ln -s 'malformed' "$test_dir/profiles/unknown/SingletonLock"
for state in dead live remote unknown; do
  touch "$test_dir/profiles/$state/SingletonCookie" "$test_dir/profiles/$state/SingletonSocket" "$test_dir/profiles/$state/SingletonUnrelated"
done
CUSTOM_USER_DATA_DIR="$test_dir/profiles" PATH="$test_dir/bin:$PATH" sh "$root/entrypoint.sh"
test ! -L "$test_dir/profiles/dead/SingletonLock"
test ! -e "$test_dir/profiles/dead/SingletonCookie"
test ! -e "$test_dir/profiles/dead/SingletonSocket"
test -e "$test_dir/profiles/dead/SingletonUnrelated"
for state in live remote unknown; do
  test -L "$test_dir/profiles/$state/SingletonLock"
  test -e "$test_dir/profiles/$state/SingletonCookie"
  test -e "$test_dir/profiles/$state/SingletonSocket"
done
printf 'Entrypoint stale, live, remote, malformed and unrelated-file checks passed\n'
