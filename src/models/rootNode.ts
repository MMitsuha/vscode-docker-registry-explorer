import * as vscode from 'vscode';

export abstract class RootNode extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        protected readonly onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined>,
        public readonly parent: RootNode | undefined = undefined
    ) {
        super(label, collapsibleState);
    }

    abstract getChildren(): Promise<vscode.TreeItem[]>;

    refresh(): void {
        this.onDidChangeTreeData.fire(this);
    }
}
