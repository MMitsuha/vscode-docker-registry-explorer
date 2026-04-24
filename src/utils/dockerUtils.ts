import { URL } from 'url';
import { log } from './logger';

export interface Tag {
    name: string;
    tags: string[] | null;
}

export interface ManifestV2LayerItem {
    mediaType: string;
    size: number;
    digest: string;
}

export interface ManifestV2 {
    schemaVersion: number;
    mediaType: string;
    config: ManifestV2LayerItem;
    layers: ManifestV2LayerItem[];
}

export interface ManifestIndexEntry {
    mediaType: string;
    digest: string;
    size: number;
    platform?: { architecture?: string; os?: string; variant?: string };
}

export interface ManifestIndex {
    schemaVersion: number;
    mediaType?: string;
    manifests: ManifestIndexEntry[];
}

type AnyManifest = ManifestV2 | ManifestIndex | { [k: string]: unknown };

export const MANIFEST_ACCEPT_HEADER = [
    'application/vnd.docker.distribution.manifest.v2+json',
    'application/vnd.docker.distribution.manifest.list.v2+json',
    'application/vnd.oci.image.manifest.v1+json',
    'application/vnd.oci.image.index.v1+json'
].join(', ');

export class RegistryError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = 'RegistryError';
    }
}

export class DockerAPIV2Helper {
    private readonly authHeader: string | undefined;

    constructor(
        public readonly baseUrl: URL,
        user: string,
        password: string
    ) {
        this.authHeader = (user || password)
            ? 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
            : undefined;
    }

    async getCatalogs(): Promise<string[]> {
        const body = await this.request<{ repositories?: string[] }>('/v2/_catalog');
        return body?.repositories ?? [];
    }

    async getTags(repository: string): Promise<Tag | null> {
        return this.request<Tag>(`/v2/${this.encodeRepository(repository)}/tags/list`);
    }

    async getManifestV2(repository: string, reference: string): Promise<ManifestV2 | null> {
        const manifest = await this.getManifestRaw(repository, reference);
        if (!manifest) {
            return null;
        }
        if (isImageManifest(manifest)) {
            return manifest;
        }
        if (isManifestIndex(manifest)) {
            const entry = selectPlatform(manifest);
            if (!entry) {
                log().warn(`Manifest index for ${repository}:${reference} has no usable platform entry.`);
                return null;
            }
            log().info(
                `Resolving index for ${repository}:${reference} via ${entry.platform?.os ?? '?'}/${entry.platform?.architecture ?? '?'} digest ${entry.digest}`
            );
            const inner = await this.getManifestRaw(repository, entry.digest);
            if (inner && isImageManifest(inner)) {
                return inner;
            }
            log().warn(`Inner manifest ${entry.digest} for ${repository} is not an image manifest.`);
            return null;
        }
        log().warn(
            `Manifest for ${repository}:${reference} has unrecognized shape. schemaVersion=${(manifest as AnyManifest).schemaVersion}, mediaType=${(manifest as AnyManifest).mediaType}, keys=${Object.keys(manifest).join(',')}`
        );
        return null;
    }

    async deleteManifestV2(repository: string, reference: string): Promise<boolean> {
        const digest = await this.getManifestDigest(repository, reference);
        if (!digest) {
            throw new RegistryError(`Could not resolve manifest digest for ${repository}:${reference}.`);
        }

        const url = this.buildUrl(`/v2/${this.encodeRepository(repository)}/manifests/${encodeURIComponent(digest)}`);
        log().info(`DELETE ${url} (digest=${digest})`);
        const response = await this.doFetch(url, { method: 'DELETE', headers: this.headers() });

        if (response.status === 202) {
            return true;
        }
        throw new RegistryError(
            `DELETE ${url} returned ${response.status}. Registries must be started with REGISTRY_STORAGE_DELETE_ENABLED=true.`,
            response.status
        );
    }

    private async getManifestRaw(repository: string, reference: string): Promise<AnyManifest | null> {
        return this.request<AnyManifest>(
            `/v2/${this.encodeRepository(repository)}/manifests/${encodeURIComponent(reference)}`,
            { accept: MANIFEST_ACCEPT_HEADER }
        );
    }

    private async getManifestDigest(repository: string, reference: string): Promise<string | null> {
        const url = this.buildUrl(`/v2/${this.encodeRepository(repository)}/manifests/${encodeURIComponent(reference)}`);
        log().info(`HEAD ${url}`);
        const response = await this.doFetch(url, {
            method: 'HEAD',
            headers: this.headers({ accept: MANIFEST_ACCEPT_HEADER })
        });

        if (!response.ok) {
            throw new RegistryError(`HEAD ${url} returned ${response.status}.`, response.status);
        }
        return response.headers.get('docker-content-digest');
    }

    private async request<T>(path: string, extra: { accept?: string } = {}): Promise<T | null> {
        const url = this.buildUrl(path);
        log().info(`GET ${url}`);
        const response = await this.doFetch(url, { headers: this.headers(extra) });

        if (response.status === 404) {
            log().warn(`GET ${url} returned 404`);
            return null;
        }
        if (!response.ok) {
            throw new RegistryError(`GET ${url} returned ${response.status}.`, response.status);
        }
        return response.json() as Promise<T>;
    }

    private async doFetch(url: string, init: RequestInit): Promise<Response> {
        try {
            return await fetch(url, init);
        } catch (error) {
            log().error(`fetch ${init.method ?? 'GET'} ${url} failed`, error);
            throw new RegistryError(`Network error contacting ${this.baseUrl}: ${formatError(error)}`);
        }
    }

    private headers(extra: { accept?: string } = {}): Record<string, string> {
        const headers: Record<string, string> = { Accept: extra.accept ?? 'application/json' };
        if (this.authHeader) {
            headers.Authorization = this.authHeader;
        }
        return headers;
    }

    private buildUrl(path: string): string {
        return new URL(path, this.baseUrl).toString();
    }

    private encodeRepository(repository: string): string {
        return repository.split('/').map(encodeURIComponent).join('/');
    }
}

function isImageManifest(m: AnyManifest): m is ManifestV2 {
    return Array.isArray((m as ManifestV2).layers);
}

function isManifestIndex(m: AnyManifest): m is ManifestIndex {
    return Array.isArray((m as ManifestIndex).manifests);
}

function selectPlatform(index: ManifestIndex): ManifestIndexEntry | undefined {
    const usable = index.manifests.filter(e => e.platform?.os !== 'unknown');
    return (
        usable.find(e => e.platform?.os === 'linux' && e.platform?.architecture === 'amd64')
        ?? usable.find(e => e.platform?.os === 'linux' && e.platform?.architecture === 'arm64')
        ?? usable.find(e => e.platform?.os === 'linux')
        ?? usable[0]
        ?? index.manifests[0]
    );
}

function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
