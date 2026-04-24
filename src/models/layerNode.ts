import * as vscode from 'vscode';
import * as path from 'path';
import { ManifestV2LayerItem } from '../utils/dockerUtils';
import { Utility } from '../utils/utility';

export class LayerNode extends vscode.TreeItem {
    public readonly iconPath = {
        light: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'light', 'Layer_16x.svg')),
        dark: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Layer_16x.svg'))
    };
    public readonly contextValue = 'layerNode';

    constructor(public readonly layerItem: ManifestV2LayerItem) {
        super(layerItem.digest, vscode.TreeItemCollapsibleState.None);
        this.tooltip = 'Layer size: ' + Utility.formatBytes(layerItem.size);
    }
}
