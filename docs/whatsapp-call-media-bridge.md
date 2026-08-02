# WhatsApp call media bridge

## Current scope

The server can expose WhatsApp Web call signalling controls: enable the call
interface, offer, accept, reject, and end a call. The WA-JS `call.offer` API
explicitly creates signalling only; it does not attach audio or video tracks.
Consequently, the HTTP endpoints in this branch must not report that a usable
voice call exists until a media bridge has been implemented.

This branch also contains an experimental phase-two media bridge. Calling
`POST /api/{session}/start-incoming-call-audio` before accepting a call
instruments WebRTC and publishes signed little-endian PCM16 chunks through the
authenticated Socket.IO `/call-media` namespace's `incoming-audio` event. Each
payload contains `mimeType` (including the browser sample rate), Base64 `data`,
`sequence`, and `timestamp`. Use
`POST /api/{session}/stop-incoming-call-audio` to stop active recorders.

Create a short-lived connection ticket with
`POST /api/{session}/call-media-ticket`, authenticated with the normal bearer
token. Connect to `/call-media` with `auth: { ticket }`. Tickets are random,
single-use, valid for at most five minutes, and bind the socket to one session
room. Never put the normal session bearer token in a Socket.IO handshake.

For outbound audio, emit `outgoing-audio` on the authenticated media socket:

```json
{
  "data": "<base64 little-endian signed PCM16>",
  "sampleRate": 48000
}
```

The acknowledgement contains `attached: true` after the Web Audio track has
replaced an existing audio sender. An `attached: false` response means that no
active WebRTC connection/audio sender was available yet. Clients should send
small timestamped chunks at their original cadence and use bounded queues.

The bridge remains experimental. It must be validated against a real WhatsApp
call and the exact pinned WhatsApp Web build before production use.

## Proposed architecture

Keep WhatsApp signalling and encryption inside the browser session. Add a
per-call media bridge alongside each WPPConnect session:

1. Install browser instrumentation before WhatsApp Web starts creating peer
   connections. Observe `RTCPeerConnection` creation and its `track`,
   `connectionstatechange`, and `iceconnectionstatechange` events.
2. Capture the incoming remote audio track and forward encoded Opus frames (or
   PCM during the prototype) to an authenticated WebSocket media endpoint.
3. Receive outbound audio over that endpoint and inject it as a live
   `MediaStreamTrack` into the WhatsApp peer connection.
4. Associate the media channel with `session`, `callId`, direction, codec, and
   sequence/timestamp metadata. Tear it down when the call ends or the browser
   session disconnects.

```text
telephone / bot / SIP gateway
             |
       authenticated WebSocket
             |
       media bridge per call
        |                |
 incoming track     outgoing track
        |                |
     Chromium / WhatsApp Web / WebRTC
```

For production telephony, a sidecar can translate WebSocket media to RTP/SRTP
and SIP. Opus at 48 kHz should remain encoded whenever possible to avoid extra
latency and transcoding loss.

## Required upstream work

The clean implementation spans three projects:

- WA-JS: a supported API for call lifecycle and access to incoming/outgoing
  media tracks. Private WhatsApp modules are unstable and should be a fallback,
  not the public contract.
- WPPConnect library: typed client methods and events that wrap that WA-JS API.
- WPPConnect Server: authenticated REST signalling endpoints plus the streaming
  media endpoint, lifecycle management, limits, and observability.

Direct `page.evaluate` calls are suitable for validating signalling in this
server branch. Media interception should first be contributed at the WA-JS
layer so it is installed early enough and remains reusable by other clients.

## Prototype milestones

1. Prove incoming audio capture in headed Chromium and persist a short test
   recording.
2. Prove outbound synthetic audio injection and confirm it is heard by the
   remote participant.
3. Replace files with a full-duplex authenticated WebSocket stream; implement
   timestamps, jitter buffering, backpressure, and reconnect/teardown rules.
4. Add headless Docker audio support and test CPU/memory use with concurrent
   sessions.
5. Add codec negotiation, optional RTP/SIP gateway support, metrics, and
   end-to-end integration tests.

## Risks and safeguards

- WhatsApp private call internals can change without notice. Pin and test the
  WhatsApp Web version used by each release.
- Headless containers have no physical microphone or speaker; outbound and
  inbound devices must be virtual or supplied directly as media tracks.
- Audio endpoints need short-lived, call-scoped credentials and strict session
  isolation. Never expose raw media through the normal bearer token alone.
- Recording and processing calls may require participant consent and legal
  controls depending on jurisdiction. Recording should be opt-in and encrypted
  at rest.
- Add timeouts and bounded queues so a slow media consumer cannot exhaust the
  server.

## Acceptance criteria for real audio support

Audio transport is complete only when two external clients can exchange speech
in both directions through the server for a sustained call, with deterministic
cleanup, bounded latency, authenticated media access, and automated coverage in
the supported Docker/headless environment.
