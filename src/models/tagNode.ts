import * as vscode from 'vscode';
import { DockerAPIV2Helper } from '../utils/dockerUtils';
import { LayerNode } from './layerNode';
import { Utility } from '../utils/utility';
import { RootNode } from './rootNode';
import { Icons } from '../utils/icons';

export class TagNode extends RootNode {
    public readonly contextValue = 'tagNode';

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
        this.tooltip = 'Expand to view total size of this image.';
    }

    async getChildren(): Promise<LayerNode[]> {
        const manifest = await this.client.getManifestV2(this.repository, this.tag);
        if (!manifest || !manifest.layers) {
            return [];
        }
        const totalSize = manifest.layers.reduce((sum, layer) => sum + layer.size, 0);
        this.tooltip = 'Image size: ' + Utility.formatBytes(totalSize);
        return manifest.layers.map(layer => new LayerNode(layer, this.icons));
    }

    getImageName(): string {
        return `${this.client.baseUrl.hostname}/${this.repository}:${this.tag}`;
    }

    deleteFromRepository(): Promise<boolean> {
        return this.client.deleteManifestV2(this.repository, this.tag);
    }
}
