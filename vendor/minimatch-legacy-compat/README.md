# Scoped legacy minimatch facade

All pattern compilation and matching use the unmodified upstream minimatch 11.0.3 engine, installed through the npm alias `minimatch-engine`. No version3 or version10 matching code is retained or relabelled. Modern namespace consumers receive upstream11.0.3 directly.

This private facade supports only the contracts used by eslint-plugin-import and glob7/8: callable matching and helpers, the Minimatch constructor, glob traversal segment metadata and String.match. Legacy traversal disables row optimization/merging so globSet indices and nonull brace alternatives stay aligned. The removed makeRe API is represented by a test-only object because eslint-plugin-import calls only .test; it is not a RegExp and must not be used as a general regex serializer.

The server's Yarn 4 resolutions scope this private workspace to legacy minimatch 3 descriptors and the Protobuf CLI glob8 descriptor `^5.0.1`. Its actual resolution identity in `yarn.lock` is `@wppconnect/minimatch-legacy-compat@workspace:vendor/minimatch-legacy-compat`, so scanners can distinguish it from the unrelated registry package `minimatch@1.0.3`. All registry engine code remains upstream 11.0.3. The facade's own version does not impersonate an upstream minimatch release.

After changing this package, update the native lockfile with `yarn install`, then validate `yarn install --immutable`, `yarn test:security` and the full OSV lockfile scan. Docker copies `vendor` before immutable installation, preserving the workspace path. Security tests exercise actual ESLint, Commitizen glob7, Protobuf CLI glob8, Archiver and modern glob consumers, installed/source metadata, expansion budgets and cancellation of filesystem traversal.

These resolutions validate the repository's Yarn installation and Docker build. They do not establish the dependency graph selected by an independent npm consumer of a published server package.
