import * as vscode from 'vscode';
import * as path from 'path';
import { URL } from 'url';
import { DockerAPIV2Helper } from '../utils/dockerUtils';
import { RepositoryNode } from './repositoryNode';
import { RootNode } from './rootNode';

export class RegistryNode extends RootNode {
    public readonly iconPath = {
        light: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'light', 'Registry_16x.svg')),
        dark: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Registry_16x.svg'))
    };
    public readonly contextValue = 'registryNode';
    private readonly client: DockerAPIV2Helper;

    constructor(
        public readonly key: string,
        user: string,
        password: string,
        onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>
    ) {
        const url = new URL(key);
        super(url.hostname, vscode.TreeItemCollapsibleState.Collapsed, onDidChangeTreeData);
        this.client = new DockerAPIV2Helper(url, user, password);
        this.tooltip = url.toString();
    }

    async getChildren(): Promise<RepositoryNode[]> {
        const repositories = await this.client.getCatalogs();
        return repositories.map(name => new RepositoryNode(name, this.client, this.onDidChangeTreeData, this));
    }
}
