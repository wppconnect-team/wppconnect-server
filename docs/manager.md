# WPPConnect Manager integration

The companion [WPPConnect Manager](https://github.com/wppconnect-team/wppconnect-manager) provides session administration, QR pairing, chats, contacts, groups and media in Portuguese and English.

## Serving the UI

The Docker image includes the static bundle at `/manager/`. Its release version and SHA-256 are fixed in the Dockerfile and verified during the build. Starting a container does not download UI code. The default profile points at the same origin.

- `MANAGER_ENABLED=false` disables static UI routes. The API continues working.
- `MANAGER_DIST=/absolute/path/to/bundle` selects a local bundle for non-Docker use. By default the server looks for `manager` in its working directory and mounts no UI routes if absent.
- `/api/`, `/api-docs`, `/files` and the original socket namespace retain their existing behavior.
- `/manager/` and client navigation paths serve the application; missing asset filenames return 404.

Use HTTPS remotely. A reverse proxy must forward `/manager/`, `/api/` and `/socket.io/`, including WebSocket upgrades. A separate Manager container uses the browser-visible server URL as `MANAGER_SERVER_URL`; Docker-internal hostnames usually are not browser-visible.

## HTTP protocol 1

Manager API requests are limited to 60 per minute per source IP, and static UI requests to 300 per minute. Excess requests return 429. Behind a proxy, the existing server proxy/IP configuration determines which clients share a limit.

Manager responses use `Cache-Control: no-store`. Administrative credentials go in `Authorization: Bearer <SECRET_KEY>`, never URL segments. Legacy routes remain available.

| Method | Path | Authorization | Result |
| --- | --- | --- | --- |
| GET | `/api/manager/info` | None | `protocol: 1`, server version and feature names. |
| GET | `/api/manager/sessions` | Secret key | `{sessions: [{session, status}]}` from stored tokens and live clients. |
| POST | `/api/manager/sessions/:session/token` | Secret key | `{session, token}` using the existing bcrypt token format. |
| POST | `/api/manager/verify` | Session token | Body `{session}`; `{authorized: true}` or HTTP 401. |
| DELETE | `/api/manager/sessions/:session` | Secret key | Removes token and user-data directory for a closed session; `{success: true}`. |

Names accepted by new routes contain 1–100 ASCII letters, digits, underscores or hyphens, beginning with a letter or digit. Reserved object/array property names are rejected. HTTP 400 means invalid input, 401 invalid credentials, 409 an active session or symlink directory, and 500 a failed operation. Failed cleanup must not be treated as successful.

Session tokens authorize only their own session. They cannot list all sessions or perform administrative cleanup. The Manager uses existing session, message, contact, group and media endpoints after obtaining a token.

There is no new user database. Browser profiles persist only names and URLs; credentials remain in memory and are lost on reload/sign-out.

## Authenticated Socket.IO namespace

Connect to `/manager` with handshake auth `{session, token}`. The transport path remains `/socket.io/`. Only valid session tokens are accepted; secret keys are not socket credentials. The server selects the room from the authenticated session; clients cannot join arbitrary rooms.

Events use `{session, data}` envelopes:

- `message`: WhatsApp message with stable ID and originating session.
- `status`: `{status}` when state changes or login completes/fails.
- `qrCode`: `{qrcode}` with the image data URL.

The UI polls authenticated status/QR endpoints to reconcile missed changes. Reconnection reloads available history and deduplicates by message ID. This is not durable event replay; WhatsApp/server must still have that history/media.

The original namespace retains compatibility behavior. Its legacy broadcasts are not the authenticated Manager channel; the new UI never subscribes to them.

## Validation and rollback

`yarn test --runInBand` runs source tests, including real HTTP/socket checks with isolated storage. Docker CI starts the built image and verifies the UI, discovery, unauthenticated rejection, deep links and disabled mode before publication.

Manager browser tests use synthetic data. Real WhatsApp pairing and text/media send/receive require a separately authorized test account; passing unit/browser/image checks does not prove live operations.

Record image tags/digests before upgrading. Roll back by restoring the previous server image and matching standalone Manager, if used. There is no database migration. The initial pre-integration source baseline was `7c73fd39ce56b6ffa52e22e951cfdcfc06ce96b8` (package 2.10.16); deployments must record their own previous image digest.

## Windows pairing troubleshooting

If WhatsApp Web repeatedly reloads or reports a browser database error before showing a QR, try a fresh, short `CUSTOM_USER_DATA_DIR` path. During validation, deeply nested Windows test profiles failed while a short isolated path generated and refreshed the QR. Preserve existing session profiles before changing this setting; do not erase a production profile to troubleshoot a test session.

Client 2.3.3 also fixes premature QR termination when a page navigation temporarily invalidates an authentication check. This server release includes that client in the lockfile.
