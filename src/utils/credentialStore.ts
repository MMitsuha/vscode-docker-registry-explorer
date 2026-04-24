import * as vscode from 'vscode';

export interface RegistryCredentials {
    user: string;
    password: string;
}

const REGISTRIES_KEY = 'vscode-docker-registry-explorer.registries';
const SECRET_PREFIX = 'vscode-docker-registry-explorer:';

export class CredentialStore {
    constructor(private readonly context: vscode.ExtensionContext) {}

    listRegistries(): string[] {
        return this.context.globalState.get<string[]>(REGISTRIES_KEY, []);
    }

    async addRegistry(url: string, credentials?: RegistryCredentials): Promise<void> {
        const registries = this.listRegistries();
        if (!registries.includes(url)) {
            registries.push(url);
            await this.context.globalState.update(REGISTRIES_KEY, registries);
        }
        if (credentials) {
            await this.context.secrets.store(SECRET_PREFIX + url, JSON.stringify(credentials));
        } else {
            await this.context.secrets.delete(SECRET_PREFIX + url);
        }
    }

    async removeRegistry(url: string): Promise<void> {
        const registries = this.listRegistries().filter(r => r !== url);
        await this.context.globalState.update(REGISTRIES_KEY, registries);
        await this.context.secrets.delete(SECRET_PREFIX + url);
    }

    async getCredentials(url: string): Promise<RegistryCredentials | undefined> {
        const raw = await this.context.secrets.get(SECRET_PREFIX + url);
        if (!raw) {
            return undefined;
        }
        try {
            return JSON.parse(raw) as RegistryCredentials;
        } catch {
            return undefined;
        }
    }
}
