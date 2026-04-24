import * as vscode from 'vscode';
import * as path from 'path';
import { DockerAPIV2Helper } from '../utils/dockerUtils';
import { TagNode } from './tagNode';
import { RootNode } from './rootNode';

export class RepositoryNode extends RootNode {
    public readonly iconPath = {
        light: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'light', 'Repository_16x.svg')),
        dark: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Repository_16x.svg'))
    };
    public readonly contextValue = 'repositoryNode';
    private _childrenCount = 0;

    constructor(
        label: string,
        private readonly client: DockerAPIV2Helper,
        onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>,
        parent: RootNode
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed, onDidChangeTreeData, parent);
    }

    get childrenCount(): number {
        return this._childrenCount;
    }

    async getChildren(): Promise<TagNode[]> {
        const response = await this.client.getTags(this.label as string);
        const tags = response?.tags ?? [];
        const nodes = tags.map(tag => new TagNode(tag, this.label as string, this.client, this.onDidChangeTreeData, this));
        nodes.sort(compareTags);
        this._childrenCount = nodes.length;
        return nodes;
    }
}

function compareTags(a: TagNode, b: TagNode): number {
    if (a.tag === 'latest') {
        return -1;
    }
    if (b.tag === 'latest') {
        return 1;
    }
    const aNum = Number(a.tag);
    const bNum = Number(b.tag);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return bNum - aNum;
    }
    return b.tag.localeCompare(a.tag);
}
