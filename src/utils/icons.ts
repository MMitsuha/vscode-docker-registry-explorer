import * as vscode from 'vscode';

export interface ThemedIcon {
    light: vscode.Uri;
    dark: vscode.Uri;
}

export class Icons {
    readonly registry: ThemedIcon;
    readonly repository: ThemedIcon;
    readonly image: ThemedIcon;
    readonly layer: ThemedIcon;

    constructor(private readonly extensionUri: vscode.Uri) {
        this.registry = this.themed('Registry_16x.svg');
        this.repository = this.themed('Repository_16x.svg');
        this.image = this.themed('Image_16x.svg');
        this.layer = this.themed('Layer_16x.svg');
    }

    private themed(name: string): ThemedIcon {
        return {
            light: vscode.Uri.joinPath(this.extensionUri, 'resources', 'light', name),
            dark: vscode.Uri.joinPath(this.extensionUri, 'resources', 'dark', name)
        };
    }
}
