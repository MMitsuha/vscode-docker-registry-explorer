import * as vscode from 'vscode';
import { ManifestV2LayerItem } from '../utils/dockerUtils';
import { Utility } from '../utils/utility';
import { Icons } from '../utils/icons';

export class LayerNode extends vscode.TreeItem {
    public readonly contextValue = 'layerNode';

    constructor(public readonly layerItem: ManifestV2LayerItem, icons: Icons) {
        super(layerItem.digest, vscode.TreeItemCollapsibleState.None);
        this.iconPath = icons.layer;
        this.tooltip = 'Layer size: ' + Utility.formatBytes(layerItem.size);
    }
}
