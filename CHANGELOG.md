# Change Log

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