# Develop integration and release readiness

Assessment date: 2026-10-23. Initial base: `main` at `3599dd0`; initial
development head: `a5c780c`. The branches had diverged by 180 main-only and
27 develop-only commits. The integration merges both histories and preserves
the current package version, 2.10.63, until the release workflow increments it.

## Open pull requests reviewed

All 12 PR heads open at the start of the assessment were integrated with merge
commits, preserving their authorship and ancestry. This is integration into
development, not a declaration that every experimental feature is stable.

| PR | Scope | Integration treatment |
| --- | --- | --- |
| [#2653](https://github.com/wppconnect-team/wppconnect-server/pull/2653) | ip-address 10.7.4 | Integrated; updated the development resolution as well as the lock |
| [#2612](https://github.com/wppconnect-team/wppconnect-server/pull/2612) | Community comments | Integrated with optional API/listener guards; upstream release dependency remains |
| [#2597](https://github.com/wppconnect-team/wppconnect-server/pull/2597) | brace-expansion security | Integrated intent with compatible patched versions in each major family, not a blanket v2-to-v5 override |
| [#2596](https://github.com/wppconnect-team/wppconnect-server/pull/2596) | basic-ftp security | Integrated 6.2.1 and regenerated lock |
| [#2590](https://github.com/wppconnect-team/wppconnect-server/pull/2590) | undici security | Integrated 6.28.1; repaired missing lock update |
| [#2579](https://github.com/wppconnect-team/wppconnect-server/pull/2579) | js-yaml security | Integrated 4.3.2; build, instrumentation, lint and full tests validate current consumers |
| [#2570](https://github.com/wppconnect-team/wppconnect-server/pull/2570) | browserslist | Integrated 4.28.9, preserving current baseline-browser-mapping |
| [#2566](https://github.com/wppconnect-team/wppconnect-server/pull/2566) | qs security | Integrated 6.16.0; repaired missing lock update |
| [#2553](https://github.com/wppconnect-team/wppconnect-server/pull/2553) | Chromium singleton cleanup | Integrated with exact filenames, verified dead local owner checks, and shell regression tests |
| [#2523](https://github.com/wppconnect-team/wppconnect-server/pull/2523) | Chatwoot LID contacts | Integrated and fixed outbound identifier fallback and event filtering |
| [#2521](https://github.com/wppconnect-team/wppconnect-server/pull/2521) | Experimental call media | Integrated; revoked media rooms/tickets on hangup and browser errors; live WhatsApp call remains unvalidated |
| [#2434](https://github.com/wppconnect-team/wppconnect-server/pull/2434) | Resource monitoring | Integrated; repaired bearer parsing and restricted session metrics to administrators |

## Standards

No separate violations of documented coding standards were found beyond
tooling-enforced formatting. Concrete implementation defects were corrected:

- SessionManager and legacy client state now invalidate together before teardown.
- Failed provider starts can retry; cancelled or replaced attempts cannot publish
  late QR, status, or message events.
- Socket QR delivery uses one PNG event; Manager delivery stays in authenticated
  session rooms. Native provider messages and acknowledgments are normalized.
- Cached token verification now repeats provider route checks and attaches the
  current adapter, preserving deny-by-default route support.
- The Manager static UI is mounted through an Express application compatible
  with the Fastify middleware bridge.
- Runtime matrix CI now applies to PRs into both develop and main.
- Docker verifies its built image before publishing tags, retains Manager and
  Media API checks, and verifies the pulled published revision.

The remaining structural concern is duplicated session state between the legacy
client map and provider handles. Regression tests cover their shared transitions;
further consolidation should be a focused follow-up.

## Spec

- Chatwoot contacts without a resolved phone number can use their preserved LID
  identifier for outgoing messages. Empty attachments do not force file sending.
- Call termination invalidates pending tickets and disconnects the correct media
  room even when the browser is gone. Stale hangup callbacks preserve a newer call.
- Resource-monitor operations keep their enable flag and authentication checks.
  Prometheus session labels are protected and reset when no longer exposed.
- Chromium cleanup does not delete live local locks, remote-host locks, malformed
  owner links, or unrelated files.
- Community comments retain explicit 501 handling when upstream methods are
  absent. This does not make the upstream feature available in published clients.

## Dependencies and security

The standalone `@wppconnect/whaileys` package returned 404. Its controlled import
name now uses the published `whaileys@6.5.1` alias. A duplicate resolutions object
from the diverged manifests was consolidated, retaining current main fixes and
development provider security resolutions.

Additional currently reported advisories were patched in Axios 0.x,
brace-expansion 1/2/5, Engine.IO, music-metadata and http-cache-semantics.
The registry audit returned zero vulnerability advisory entries after integration;
22 deprecation notices remain. See [security resolutions](security-resolutions.md).

Puppeteer 25 remains pinned for its security fix. It was validated with a real
installed Chrome executable. Docker explicitly uses `/usr/bin/chromium`.

## Validation

- Node.js 22.22.2 and Yarn 4.14.1.
- Immutable Yarn installation, TypeScript/Babel build and ESLint.
- Full Jest suite, including actual Chromium WebRTC and Socket.IO transport tests.
- Four real provider QR flows plus seven runtime imports: 11/11 checks passed.
- Whaileys group encryption/decryption round trip passed.
- HTTP smoke: 14 checks covering health, Manager/static/auth, dashboard, metrics,
  Media API disabled response and inactive community-comment session response.
- Compose environment/defaults/port mapping contract passed.
- Shell regression checks for stale/live/remote/malformed Chromium locks passed.

No accounts were paired and no WhatsApp messages were sent. QR generation proves
runtime startup and pairing output; it does not prove connected feature parity.
Docker Engine was unavailable locally; container build and smoke validation are
performed by the PR workflow and must pass before promotion.

## Release gates and migration

The main-promotion CodeQL scan additionally identified an upload-file path,
an ambiguous whitespace regex in contact splitting, and an administrator secret
read from a GET path. The follow-up uses a trusted upload directory, linear
delimiter splitting, and a header-only aggregate resource endpoint:
`GET /api/sessions/resource-usage` with an administrator bearer token.

1. Require all release PR CI checks, including container verification and the
   four-provider QR matrix, to pass on the current head.
2. Treat the embedding API change as a major release: `initServer` now returns
   a Promise containing a Fastify application. Existing synchronous Express
   embedding code must migrate. Breaking conventional commits select a major
   increment in the release workflow.
3. Validate connected accounts, reconnects, send/receive, acknowledgments, media,
   and application-specific routes before declaring experimental providers stable.
4. Validate an actual WhatsApp call before declaring the call media bridge stable.
5. Do not announce community comments as available until WA-JS #3713 and
   WPPConnect #2912 are merged, released in order and consumed by this server.

Embedding migration:

```typescript
const { app } = await initServer({ secretKey: process.env.SECRET_KEY });
// app is a Fastify instance; use its APIs, or mount Express middleware via app.use.
// For controlled shutdown:
await app.close();
```

All ordinary contribution PRs target `develop`. Maintainers promote validated
changes through a `develop` -> `main` release PR, then synchronize release commits
back into `develop`. The experimental limitations above must remain in release
notes until their separate validation is complete.
