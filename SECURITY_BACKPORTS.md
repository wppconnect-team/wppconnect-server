# Private deepmerge backport

This repository-maintained artifact is based on deepmerge4.3.1 and the prototype-poisoning fix from upstream PR274, commit c5ad573121574db1c625b0aabcc6114ed7df6c5a. Its local version4.3.2+wppconnect.1 identifies our security patch and preserves4.x dependency compatibility. It is not a published upstream release. The package is private and must not be published to a registry.

Both copy loops reject the `__proto__` key before assigning properties. Other merging behavior is preserved. The is-mergeable-object1.1.0 helper is included locally because the original Git source declares it only as a development dependency. Original MIT notices are retained.

Source references:

- https://github.com/TehShrike/deepmerge/tree/5b87756a5671635679001cbac72aa42f23472c81
- https://github.com/TehShrike/deepmerge/pull/274/commits/c5ad573121574db1c625b0aabcc6114ed7df6c5a
- https://github.com/TehShrike/is-mergeable-object/tree/v1.1.0

The readable files in vendor/deepmerge and the local tarball represent the same runtime implementation. Native installed-package tests compare their contents. No install scripts, registry publication or changes to unrelated installed dependencies are needed.

For the server, the repository resolution selects the private artifact. The startup protection also uses Node's synchronous module-resolution hooks for affected deepmerge requests from Puppeteer Extra consumers, before loading the server dependencies. This covers registry installations where repository resolutions are not inherited and npm can install a separate original copy. Unrelated packages and already-fixed versions retain normal resolution. The server already requires Node 22.22.2, which provides this API.

Keep the regression tests when removing this backport after a validated upstream release is available.
