# Contributing to WPPConnect Server

## Branch policy

Open every contribution PR against **`develop`**. Features, fixes, documentation, and dependency updates are integrated and tested there. **`main` receives release promotion PRs from `develop`**, reviewed by maintainers after integration validation.

```bash
git fetch origin
git switch -c fix/describe-your-change origin/develop
corepack enable
corepack prepare yarn@4.14.1 --activate
yarn install --immutable
```

## Before opening a PR

- Use the Node.js version in `package.json`.
- Explain the problem and resulting behavior, with an issue reference where applicable.
- Add tests and documentation for changed public behavior.
- Run `yarn build`, `yarn lint`, and `yarn test --runInBand` as applicable.
- Run the provider matrix for provider/session/runtime changes. Connected behavior needs authorized-account evidence.
- Regenerate and commit `yarn.lock` for dependency changes; verify immutable installation.
- Keep secrets, tokens, QR payloads, profiles, and private `.env` files out of the PR.
- Select **base: `develop`**. Describe experimental behavior and pending validation.

Use focused conventional commit messages, such as `fix(session): release failed initialization`.

## Release process

Synchronize `main` into `develop` when releases or urgent fixes have advanced the stable branch. After integration checks pass, maintainers open a **`develop` -> `main`** release PR with scope, test evidence, compatibility notes, and remaining release gates.

Promote only after CI, container checks, and relevant runtime validation are satisfactory. Merging to `main` invokes the release workflow; maintainers manage versions and changelogs there. Synchronize release commits back into `develop`.

## Reports

Use issues for reproducible bugs, including version, provider, environment, sanitized logs, and reproduction steps. Report vulnerabilities privately through the repository's Security Advisories page.
