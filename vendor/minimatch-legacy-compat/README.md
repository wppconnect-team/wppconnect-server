# Scoped legacy minimatch facade

All pattern compilation and matching use the unmodified upstream minimatch 11.0.3 engine, installed through the npm alias `minimatch-engine`. No version3 or version10 matching code is retained or relabelled. Modern namespace consumers receive upstream11.0.3 directly.

This private facade supports only the contracts used by eslint-plugin-import and glob7: callable matching and helpers, the Minimatch constructor, glob traversal segment metadata and String.match. Legacy traversal disables row optimization/merging so globSet indices and nonull brace alternatives stay aligned. The removed makeRe API is represented by a test-only object because eslint-plugin-import calls only .test; it is not a RegExp and must not be used as a general regex serializer.

The server's Yarn 4 resolutions scope this facade to minimatch 3 descriptors. Their `file:vendor/wppconnect-minimatch-legacy-compat-1.0.3.tgz` paths resolve from the repository root. Yarn records the local artifact identity and checksum in `yarn.lock`. Modern minimatch descriptors receive upstream 11.0.3 directly; modern glob descriptors receive upstream 14.0.2, while legacy glob 7 retains its callback API.

After changing this package, regenerate the archive and run `yarn install` to update the native lockfile, then validate with `yarn install --immutable` and `yarn test:security`. The Docker build context explicitly includes the archive before its immutable dependency install. The security suite checks actual ESLint, Commitizen, Archiver and modern glob consumers, installed/source metadata, pattern expansion budgets and cancellation of filesystem traversal.

These resolutions validate the repository's Yarn installation and Docker build. They do not establish the dependency graph selected by an independent npm consumer of a published server package.

Regenerate the committed local package after source changes with `npm pack ./vendor/minimatch-legacy-compat --pack-destination vendor --ignore-scripts`. This local archive is not published. The registry engine retains its own license.
