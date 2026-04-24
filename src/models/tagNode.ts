import * as vscode from 'vscode';
import { DockerAPIV2Helper, ManifestV2 } from '../utils/dockerUtils';
import { LayerNode } from './layerNode';
import { Utility } from '../utils/utility';
import { RootNode } from './rootNode';
import { Icons } from '../utils/icons';

export class TagNode extends RootNode {
    public readonly contextValue = 'tagNode';
    private manifestPromise: Promise<ManifestV2 | null> | undefined;

    constructor(
        public readonly tag: string,
        public readonly repository: string,
        private readonly client: DockerAPIV2Helper,
        private readonly icons: Icons,
        onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>,
        parent: RootNode
    ) {
        super(tag, vscode.TreeItemCollapsibleState.Collapsed, onDidChangeTreeData, parent);
        this.iconPath = icons.image;
        // Tooltip left undefined - populated lazily via resolveTreeItem so it can show the total image size.
    }

    async resolveTooltip(): Promise<string> {
        const manifest = await this.getManifest();
        if (!manifest || !manifest.layers) {
            return `${this.repository}:${this.tag}\nSize unavailable`;
        }
        const totalSize = manifest.layers.reduce((sum, layer) => sum + layer.size, 0);
        return `${this.repository}:${this.tag}\nImage size: ${Utility.formatBytes(totalSize)}`;
    }

    async getChildren(): Promise<LayerNode[]> {
        const manifest = await this.getManifest();
        if (!manifest || !manifest.layers) {
            return [];
        }
        return manifest.layers.map(layer => new LayerNode(layer, this.icons));
    }

    getImageName(): string {
        return `${this.client.baseUrl.hostname}/${this.repository}:${this.tag}`;
    }

    deleteFromRepository(): Promise<boolean> {
        return this.client.deleteManifestV2(this.repository, this.tag);
    }

    private getManifest(): Promise<ManifestV2 | null> {
        if (!this.manifestPromise) {
            this.manifestPromise = this.client.getManifestV2(this.repository, this.tag);
        }
        return this.manifestPromise;
    }
}
