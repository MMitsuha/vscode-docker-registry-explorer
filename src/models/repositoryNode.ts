import * as vscode from 'vscode';
import { DockerAPIV2Helper } from '../utils/dockerUtils';
import { TagNode } from './tagNode';
import { RootNode } from './rootNode';
import { Icons } from '../utils/icons';

export class RepositoryNode extends RootNode {
    public readonly contextValue = 'repositoryNode';
    private _childrenCount = 0;

    constructor(
        label: string,
        private readonly client: DockerAPIV2Helper,
        private readonly icons: Icons,
        onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>,
        parent: RootNode
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed, onDidChangeTreeData, parent);
        this.iconPath = icons.repository;
    }

    get childrenCount(): number {
        return this._childrenCount;
    }

    async getChildren(): Promise<TagNode[]> {
        const response = await this.client.getTags(this.label as string);
        const tags = response?.tags ?? [];
        const nodes = tags.map(tag => new TagNode(tag, this.label as string, this.client, this.icons, this.onDidChangeTreeData, this));
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
