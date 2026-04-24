import * as vscode from 'vscode';
import { CredentialStore } from '../utils/credentialStore';
import { RegistryNode } from '../models/registryNode';
import { RootNode } from '../models/rootNode';
import { TagNode } from '../models/tagNode';
import { Icons } from '../utils/icons';
import { log } from '../utils/logger';

export class PrivateDockerExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private readonly credentialStore: CredentialStore,
        private readonly icons: Icons
    ) {}

    refresh(): void {
        log().info('Explorer refresh requested');
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: RootNode): Promise<vscode.TreeItem[]> {
        try {
            if (element) {
                log().info(`getChildren for ${element.constructor.name}(${element.label ?? ''})`);
                const children = await element.getChildren();
                log().info(`getChildren returned ${children.length} items for ${element.constructor.name}(${element.label ?? ''})`);
                return children;
            }
            const registries = this.credentialStore.listRegistries();
            log().info(`Loading ${registries.length} root registries`);
            const nodes: RegistryNode[] = [];
            for (const url of registries) {
                const creds = await this.credentialStore.getCredentials(url);
                nodes.push(new RegistryNode(url, creds?.user ?? '', creds?.password ?? '', this.icons, this._onDidChangeTreeData));
            }
            return nodes;
        } catch (error) {
            const label = element ? `${element.constructor.name}(${element.label ?? ''})` : 'root';
            log().error(`getChildren failed for ${label}`, error);
            vscode.window.showErrorMessage(`Failed to load ${label}: ${formatError(error)}`);
            return [];
        }
    }

    async resolveTreeItem(item: vscode.TreeItem, element: vscode.TreeItem): Promise<vscode.TreeItem> {
        if (element instanceof TagNode) {
            try {
                item.tooltip = await element.resolveTooltip();
            } catch (error) {
                log().error(`resolveTooltip failed for tag ${element.tag}`, error);
                item.tooltip = `Failed to load size: ${formatError(error)}`;
            }
        }
        return item;
    }
}

function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
