import * as vscode from 'vscode';
import { URL } from 'url';
import { DockerAPIV2Helper } from '../utils/dockerUtils';
import { RepositoryNode } from './repositoryNode';
import { RootNode } from './rootNode';
import { Icons } from '../utils/icons';

export class RegistryNode extends RootNode {
    public readonly contextValue = 'registryNode';
    private readonly client: DockerAPIV2Helper;

    constructor(
        public readonly key: string,
        user: string,
        password: string,
        private readonly icons: Icons,
        onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>
    ) {
        const url = new URL(key);
        super(url.hostname, vscode.TreeItemCollapsibleState.Collapsed, onDidChangeTreeData);
        this.client = new DockerAPIV2Helper(url, user, password);
        this.iconPath = icons.registry;
        this.tooltip = url.toString();
    }

    async getChildren(): Promise<RepositoryNode[]> {
        const repositories = await this.client.getCatalogs();
        return repositories.map(name => new RepositoryNode(name, this.client, this.icons, this.onDidChangeTreeData, this));
    }
}
