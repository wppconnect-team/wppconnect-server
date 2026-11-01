# Scoped legacy development-consumer facade

All pattern compilation and matching use the unmodified upstream minimatch 11.0.3 engine, installed through the npm alias `minimatch-engine`. No version3 or version10 matching code is retained or relabelled. Modern namespace consumers receive upstream11.0.3 directly.

This private facade supports only the contracts used by eslint-plugin-import and glob7: callable matching and helpers, the Minimatch constructor, glob traversal segment metadata and String.match. Legacy traversal disables row optimization/merging so globSet indices and nonull brace alternatives stay aligned. The removed makeRe API is represented by a test-only object because eslint-plugin-import calls only .test; it is not a RegExp and must not be used as a general regex serializer.

The override is scoped to the named legacy consumer. Its ../../vendor file spec resolves from that consumer under node_modules; npm records the canonical root-relative tarball and integrity in package-lock.json. A fresh npm ci and real-consumer tests are required after dependency layout changes.

Regenerate the committed local package after source changes with `npm pack ./vendor/minimatch-legacy-compat --pack-destination vendor --ignore-scripts`. This local archive is not published. The registry engine retains its own license.
