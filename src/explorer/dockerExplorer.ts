import * as vscode from 'vscode';
import { RegistryNode } from '../models/registryNode';
import { URL } from 'url';
import { Globals } from '../globals';
import { Utility } from '../utils/utility';
import { RootNode } from '../models/rootNode';

export class PrivateDockerExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    async refresh(): Promise<void> {
        this._onDidChangeTreeData.fire(undefined);
    }

    constructor(private context: vscode.ExtensionContext) {

    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: RootNode | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            return new Promise(async resolve => {
                let chldrns: RegistryNode[] = new Array<RegistryNode>();
                let keytar: any = Utility.getCoreNodeModule('keytar');

                let nodesData: string[] = this.context.globalState.get(Globals.GLOBAL_STATE_REGS_KEY, []);

                for (let i = 0; i < nodesData.length; i++) {
                    const key = nodesData[i];
                    let url: URL = new URL(key);
                    let user: string | null = null;
                    let password: string | null = null;
                    if (keytar) {
                        user = await keytar.getPassword(Globals.KEYTAR_SECRETS_KEY, `${url}.${Globals.KEYTAR_SECRETS_ACCOUNT_USER_POSTFIX_KEY}`);
                        password = await keytar.getPassword(Globals.KEYTAR_SECRETS_KEY, `${url}.${Globals.KEYTAR_SECRETS_ACCOUNT_PASSWORD_POSTFIX_KEY}`);
                    }
                    chldrns.push(new RegistryNode(url.hostname, url.toString(), vscode.TreeItemCollapsibleState.Collapsed, url.toString(), user || '', password || '', this._onDidChangeTreeData));
                }

                resolve(chldrns);
            });
        } else {
            return element.getChildren();
        }
    }
}