# Contributing

## Setup

```bash
git clone https://github.com/luisfd3v/cli-templates-dotnetspa.git
cd cli-templates-dotnetspa
npm install
```

`npm install` also wires the `commit-msg` git hook (via husky), so a badly
formatted commit message is rejected before it is created.

## Your commit message decides the version

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
and [semantic-release](https://semantic-release.gitbook.io/). Releases are fully
automatic: nothing is published by hand, and there is no "bump the version"
step. Your commit message is the only input to that decision.

| Commit message | What gets released |
| --- | --- |
| `fix: correct the Angular output path` | patch — `1.0.0` → `1.0.1` |
| `perf: avoid a redundant dotnet restore` | patch |
| `feat: add a Svelte template` | minor — `1.0.0` → `1.1.0` |
| `feat!: drop Node 20 support` | major — `1.0.0` → `2.0.0` |
| `docs:`, `chore:`, `ci:`, `test:`, `refactor:`, `style:`, `build:` | nothing published |

A `BREAKING CHANGE:` footer in the body also forces a major release.

Not every merge produces a release, and that is intended. If `docs:` commits
published a version, the version number would stop meaning anything.

## The pull request title is what counts

If you follow the usual "Squash and merge" flow, GitHub uses your **pull request
title** as the commit message on `main`. That is the message semantic-release
reads — so a tidy commit history with a vague PR title like `Update stuff`
results in **no release at all**.

Write the PR title in the same Conventional Commits format as a commit message:

```
feat: add a Svelte client template
fix: stop the Vite proxy from ignoring the dev certificate
```

CI enforces this: it lints every commit in the PR *and* the PR title itself, so a
problem is caught before merge rather than after.

## Before opening a pull request

```bash
npm run typecheck
npm test
npm run build
```

Templates are read from `templates/` at runtime, so editing a template does not
need a rebuild. Only changes under `src/` do.

If you touched a template, please generate a project and check it really builds:

```bash
node dist/cli.js --name Teste -f vue -c coupled -a minimal -y --force
cd teste && dotnet build && dotnet run --project src/Teste.API --launch-profile https
```

GitHub Actions cannot run `dotnet` and `npm` inside a generated project for every
combination, so manual checks on the affected combination are genuinely valuable.

## Release flow, for maintainers

Nothing to do. On every push to `main`, `.github/workflows/release.yml` runs
semantic-release, which:

1. analyses the commits since the last tag,
2. works out the next version,
3. updates `CHANGELOG.md` and `package.json`,
4. tags the release and opens a GitHub Release,
5. publishes to npm.

Publishing authenticates with npm through OIDC trusted publishing, so there is no
`NPM_TOKEN` secret in this repository. If a release fails with `ENEEDAUTH`, check
that the workflow filename configured on npmjs.com matches `release.yml` exactly
and that the trusted publisher is allowed to run `npm publish` (newer npm
configurations default to `npm stage publish` only).
