#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
test_dir=$(mktemp -d)
server_pid=""
cleanup() {
  [ -n "$server_pid" ] && kill "$server_pid" 2>/dev/null || true
  rm -rf -- "$test_dir"
}
trap cleanup EXIT HUP INT TERM
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }

data="$test_dir/data"
mkdir -p "$test_dir/bin"

# Fake "node" that behaves like a live server: it creates Chromium-style
# Singleton* symlinks inside a session profile and stays alive.
cat > "$test_dir/bin/live-node" <<'EOS'
#!/bin/sh
echo $$ > "$TEST_DIR/server.pid"
mkdir -p "$CUSTOM_USER_DATA_DIR/session1"
for n in SingletonLock SingletonSocket SingletonCookie; do
  ln -sf "fakehost-$$" "$CUSTOM_USER_DATA_DIR/session1/$n"
done
exec sleep 60
EOS
# Fake "node" for a server that has already exited.
printf '#!/bin/sh\nexit 0\n' > "$test_dir/bin/dead-node"
chmod +x "$test_dir/bin/live-node" "$test_dir/bin/dead-node"

# run_entrypoint <fake-node>: run the real entrypoint with that fake node.
run_entrypoint() {
  cp "$test_dir/bin/$1" "$test_dir/bin/node"
  TEST_DIR="$test_dir" CUSTOM_USER_DATA_DIR="$data" PATH="$test_dir/bin:$PATH" sh "$root/entrypoint.sh"
}

# 1. Live owner, data dir ABSENT at first start (startup-ordering regression).
#    A second entrypoint must refuse to start and keep the live symlinks.
run_entrypoint live-node &
i=0
while [ ! -L "$data/session1/SingletonLock" ] && [ "$i" -lt 50 ]; do sleep 0.1; i=$((i + 1)); done
[ -L "$data/session1/SingletonLock" ] || fail "first server never created its symlinks"
server_pid=$(cat "$test_dir/server.pid")
if run_entrypoint dead-node 2>/dev/null; then
  fail "second entrypoint started while the first one is alive"
fi
for n in SingletonLock SingletonSocket SingletonCookie; do
  [ -L "$data/session1/$n" ] || fail "$n was deleted while its owner was alive"
done

# 2. Owner gone and directory previously managed: stale symlinks are removed,
#    unrelated files are left alone.
kill "$server_pid"; server_pid=""; sleep 0.5
touch "$data/session1/SingletonUnrelated"
run_entrypoint dead-node
for n in SingletonLock SingletonSocket SingletonCookie; do
  [ ! -L "$data/session1/$n" ] || fail "stale $n was not removed"
done
[ -e "$data/session1/SingletonUnrelated" ] || fail "unrelated file was removed"

# 3. Legacy directory (Singleton* present, never managed by this entrypoint):
#    owner cannot be proven dead, so refuse unless explicitly forced.
rm -rf "$data"; mkdir -p "$data/session1"
ln -s "oldhost-1" "$data/session1/SingletonLock"
if run_entrypoint dead-node 2>/dev/null; then
  fail "legacy directory with unknown owner was accepted"
fi
[ -L "$data/session1/SingletonLock" ] || fail "legacy symlink was deleted without FORCE_CLEAN_CHROMIUM_LOCKS"
FORCE_CLEAN_CHROMIUM_LOCKS=1 run_entrypoint dead-node
[ ! -L "$data/session1/SingletonLock" ] || fail "FORCE_CLEAN_CHROMIUM_LOCKS did not clean"

printf 'Entrypoint live-owner, stale cleanup, migration and startup-ordering checks passed\n'
