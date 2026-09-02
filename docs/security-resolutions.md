# Security dependency resolutions

The root resolutions are temporary compatibility bridges for transitive
packages whose published dependency ranges still select vulnerable releases.
They must be removed when the owning runtime publishes a compatible upgrade.

| Dependency | Consumer | Reason | Required validation |
| ---------- | -------- | ------ | ------------------- |
| `axios@^0.24.0` → `0.33.0` | Whaileys | First 0.x release outside the current advisory ranges; avoids forcing Axios 1.x | QR, connection and HTTP media fetch |
| `libsignal` → `6.0.0` | Whaileys | Replaces the old Git snapshot containing vulnerable ProtobufJS | Signal and group-message round trip |
| `music-metadata` → `11.15.0` | Whaileys | Fixes malformed-media infinite-loop advisories | Audio metadata and audio send |
| `protobufjs-cli` → `2.7.0` | Whaileys | Removes the legacy ProtobufJS toolchain | Provider import and generated protocol loading |
| `protobufjs` → `7.6.6` | Baileys family and libsignal | Fixes parser, recursion and prototype advisories while staying on major 7 | Provider import, Signal and QR |
| `puppeteer` → `25.9.0` | WPPConnect | Removes the vulnerable `extract-zip` chain in Puppeteer 24 | Chromium launch, QR and WA-JS injection |
| `body-parser` / `qs` | Fastify Express bridge | Fixes request parsing denial-of-service advisories | HTTP route and payload tests |

Other resolutions stay within their package family and are tracked by
`yarn audit:security`. The audit gate fails on registry security advisories and
reports deprecation notices separately because Yarn represents both as a
non-zero audit result.
