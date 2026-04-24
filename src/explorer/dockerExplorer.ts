import * as vscode from 'vscode';
import { CredentialStore } from '../utils/credentialStore';
import { RegistryNode } from '../models/registryNode';
import { RootNode } from '../models/rootNode';
import { Icons } from '../utils/icons';

export class PrivateDockerExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private readonly credentialStore: CredentialStore,
        private readonly icons: Icons
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: RootNode): Promise<vscode.TreeItem[]> {
        if (element) {
            return element.getChildren();
        }
        const registries = this.credentialStore.listRegistries();
        const nodes: RegistryNode[] = [];
        for (const url of registries) {
            const creds = await this.credentialStore.getCredentials(url);
            nodes.push(new RegistryNode(url, creds?.user ?? '', creds?.password ?? '', this.icons, this._onDidChangeTreeData));
        }
        return nodes;
    }
}
