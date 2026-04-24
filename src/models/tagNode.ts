import * as vscode from 'vscode';
import * as path from 'path';
import { DockerAPIV2Helper } from '../utils/dockerUtils';
import { LayerNode } from './layerNode';
import { Utility } from '../utils/utility';
import { RootNode } from './rootNode';

export class TagNode extends RootNode {
    public readonly iconPath = {
        light: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'light', 'Image_16x.svg')),
        dark: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Image_16x.svg'))
    };
    public readonly contextValue = 'tagNode';

    constructor(
        public readonly tag: string,
        public readonly repository: string,
        private readonly client: DockerAPIV2Helper,
        onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>,
        parent: RootNode
    ) {
        super(tag, vscode.TreeItemCollapsibleState.Collapsed, onDidChangeTreeData, parent);
        this.tooltip = 'Expand to view total size of this image.';
    }

    async getChildren(): Promise<LayerNode[]> {
        const manifest = await this.client.getManifestV2(this.repository, this.tag);
        if (!manifest || !manifest.layers) {
            return [];
        }
        const totalSize = manifest.layers.reduce((sum, layer) => sum + layer.size, 0);
        this.tooltip = 'Image size: ' + Utility.formatBytes(totalSize);
        return manifest.layers.map(layer => new LayerNode(layer));
    }

    getImageName(): string {
        return `${this.client.baseUrl.hostname}/${this.repository}:${this.tag}`;
    }

    deleteFromRepository(): Promise<boolean> {
        return this.client.deleteManifestV2(this.repository, this.tag);
    }
}
