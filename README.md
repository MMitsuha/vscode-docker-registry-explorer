# Docker Registry Explorer

Browse and manage images on private Docker Registry v2 / OCI distribution servers from the VS Code Explorer side bar.

Fork of the original extension, modernized for current VS Code and OCI registries.

## Features

### Add any number of registries

Point it at any server that implements the [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/) (or the [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec)). Credentials are stored via VS Code's built-in [`SecretStorage`](https://code.visualstudio.com/api/references/vscode-api#SecretStorage) — no extra dependencies, no plaintext on disk.

Two authentication modes:

- **Anonymous** — no credentials sent, good for public mirrors and read-only internal registries.
- **Basic** — HTTP Basic auth with a username + password.

![Add Registry](images/add_registry.png)

### Browse the tree

Registry → repositories → tags → layers. Repository names with slashes (`team/app`) are handled correctly.

![List images, tags and layers](images/list_images_tags_layers.png)

### See image and layer sizes on hover

Hover a tag to see its total image size; hover a layer to see that layer's size.

![image size](images/image_size.png)
![layer size](images/layer_size.png)

Multi-arch images are resolved transparently: the manifest index is followed (preferring `linux/amd64`, then `linux/arm64`, then any usable linux entry) and the chosen platform's layers are shown.

### Perform actions on tags

- **Copy name** — copies `registry/repo:tag` to the clipboard.
- **Pull** — opens a terminal pre-filled with `docker pull …`.
- **Remove local** — opens a terminal pre-filled with `docker rmi …`.
- **Delete from repository** — issues `HEAD` to resolve the manifest digest, then `DELETE` against the digest (the API v2 requirement). Registry must be started with `REGISTRY_STORAGE_DELETE_ENABLED=true`.

![tag actions](images/tag_actions.png)

### Manage registry entries

Refresh to reload, or delete an entry to remove it from the tree and purge its credentials from `SecretStorage`.

![registry actions](images/registry_actions.png)

## Requirements

- VS Code `>= 1.90`
- A registry implementing the Docker V2 / OCI Distribution API

## Troubleshooting

Every request, error, and activation step is logged to an output channel. Open it via **View → Output → Docker Registry Explorer**, or run **Docker Registry Explorer: Show logs** from the command palette.

The channel auto-opens on the first error. Include the log when reporting a bug.

## Known limitations

- Only Basic Authentication is supported. Bearer-token flows (Docker Hub's token service, registries behind OAuth2) are not yet implemented.
- Schema v1 manifests are not supported — they predate OCI and omit layer sizes. Images pushed with any modern docker/buildx are v2 or OCI and work.

## License

MIT — see [LICENSE.txt](LICENSE.txt).
