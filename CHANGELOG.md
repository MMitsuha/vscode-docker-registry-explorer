# Change Log

## 0.2.4 - 2026-04-24

### Fixed
- "Size unavailable" / empty expand on multi-arch images. For manifest lists / OCI indexes the registry returns a list of per-platform manifests (no `layers` field), which was previously treated as a malformed manifest. Now `getManifestV2` transparently follows the index: it picks a platform (preferring `linux/amd64`, then `linux/arm64`, then any usable linux entry) and re-fetches that image manifest, so both hover size and layer expansion work.
- Unrecognized manifest shapes now log `schemaVersion`, `mediaType`, and top-level keys so a future registry quirk is diagnosable from the output channel.

## 0.2.3 - 2026-04-24

### Fixed
- Tag tooltips now show the total image size. The old implementation mutated `tooltip` inside `getChildren` after the tree item was already rendered, so VS Code never picked up the new value. Replaced with `TreeDataProvider.resolveTreeItem`, which lazily fetches the manifest on hover.

### Changed
- Manifest fetch for a tag is now cached per `TagNode` instance and reused by both `resolveTreeItem` (for the size tooltip) and `getChildren` (for the layer list), so hover + expand share a single HTTP request.

## 0.2.2 - 2026-04-24

### Fixed
- Activation crash: `Icons` used class field initializers that called `this.themed(...)`, which runs before the constructor's parameter property `extensionUri` is assigned. With target `es2022` + `useDefineForClassFields`, field initializers execute first, so `vscode.Uri.joinPath(undefined, ...)` threw and blocked activation. Moved the initialization into the constructor body.

## 0.2.1 - 2026-04-24

### Fixed
- Tree icons now load correctly. Paths were built from `__filename` with three `..` segments, which resolved outside the extension root after esbuild bundled everything into `dist/extension.js`. Icons are now resolved from `context.extensionUri`.

### Added
- `Docker Registry Explorer` output channel with timestamped logs at every error path: activation, command handlers, tree `getChildren`, HTTP requests (GET/HEAD/DELETE), `fetch` network errors, and `SecretStorage` failures. The channel auto-opens on the first error.
- `Docker Registry Explorer: Show logs` command to open the output channel from the command palette.

## 0.2.0 - 2026-04-24

### Breaking
- Credentials are now stored via VS Code's `SecretStorage` API instead of `keytar`. Previously saved credentials will not carry over — re-add each registry once after upgrading.

### Fixed
- Remote image deletion now resolves the manifest digest via `HEAD` before issuing `DELETE`, matching the Docker Registry v2 spec. Previous versions failed on any compliant registry.
- Registries are now saved even when only a URL is provided (prior Basic-auth path silently dropped the entry when keytar was unavailable).
- URL input now rejects non-`http(s)` protocols.
- Repository names containing `/` (e.g. `team/app`) are now path-encoded correctly.
- HTTP errors are surfaced as error messages instead of silently returning stale bodies.

### Added
- OCI manifest and manifest-list (multi-arch) media types are now sent in the `Accept` header, so images pushed by modern `docker`/`buildx` load correctly.

### Changed
- Replaced `typed-rest-client` with native `fetch`.
- Replaced `copy-paste` with `vscode.env.clipboard`.
- Dropped dependencies: `typed-rest-client`, `copy-paste`, `@types/copy-paste`, `keytar`.
- Internal refactor: removed `new Promise(async resolve => ...)` anti-patterns, fixed `chldrenCount` typo, tightened types, centralized credential handling in `CredentialStore`.

## 0.1.3 - 2018-08-10

### Added
- Small UI tweaks

### Fixed
- Fixed errors on image deletion from registry

## 0.1.2 - 2018-06-22

### Added
- If docker iamge tags are numbers, will be sorted as a number

## 0.1.1 - 2018-05-22

### Added

- Better user messages for regisrty url input
- Docker image tags are now lexicographically sorted (except for the 'latest' tag that will be always on top)

## 0.0.1 - 2018-05-06

### Added

- Add registries endpoints
- List repositories
- List images
- List layers
- View size of a layer or whole image
- Pull image
- Remove pulled image
- Delete image from registry