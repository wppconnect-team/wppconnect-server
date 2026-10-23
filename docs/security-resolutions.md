# Security dependency resolutions

The root resolutions are temporary compatibility bridges for transitive
packages whose published dependency ranges still select vulnerable releases.
They must be removed when the owning runtime publishes a compatible upgrade.

| Dependency | Consumer | Reason | Required validation |
| ---------- | -------- | ------ | ------------------- |
| `axios@^0.24.0` -> `0.34.0` | Whaileys | Patches the currently reported prototype-pollution gadgets without forcing Axios 1.x | QR, connection and HTTP media fetch |
| `libsignal` → `6.0.0` | Whaileys | Replaces the old Git snapshot containing vulnerable ProtobufJS | Signal and group-message round trip |
| `music-metadata` -> `11.16.0` | Baileys family | Fixes malformed MP4 and EBML parser advisories | Provider imports, audio metadata and audio send |
| `protobufjs-cli` → `2.7.0` | Whaileys | Removes the legacy ProtobufJS toolchain | Provider import and generated protocol loading |
| `protobufjs` → `7.6.6` | Baileys family and libsignal | Fixes parser, recursion and prototype advisories while staying on major 7 | Provider import, Signal and QR |
| `puppeteer` → `25.9.0` | WPPConnect | Removes the vulnerable `extract-zip` chain in Puppeteer 24 | Chromium launch, QR and WA-JS injection |
| `body-parser` / `qs` | Fastify Express bridge | Fixes request parsing denial-of-service advisories | HTTP route and payload tests |

The integration also patches `brace-expansion` within each consumer's major
family (1.1.21, 2.1.7 and 5.0.12), `engine.io` to 6.6.10 and
`http-cache-semantics` to 4.3.0. A blanket brace-expansion major upgrade can
change the module interface expected by minimatch and is intentionally avoided.

The scoped Whaileys package is currently installed through the published alias
`npm:whaileys@6.5.1`, because the standalone `@wppconnect/whaileys` registry
entry returns 404. Provider imports and group encryption must be validated when
changing this alias. Chromium launch uses Puppeteer 25; the Docker runtime
explicitly selects its installed `/usr/bin/chromium`.

Run `yarn npm audit --all --recursive --json` to inspect registry advisories.
Yarn also reports deprecations as non-zero audit results; a deprecation notice
is different from a vulnerability advisory. The snapshot checked on 2026-10-23
contained zero vulnerability advisories and 22 deprecation notices after these
updates. OSV-Scanner workflows independently scan the committed lockfile.
