import * as vscode from 'vscode';

export interface ThemedIcon {
    light: vscode.Uri;
    dark: vscode.Uri;
}

export class Icons {
    constructor(private readonly extensionUri: vscode.Uri) {}

    readonly registry = this.themed('Registry_16x.svg');
    readonly repository = this.themed('Repository_16x.svg');
    readonly image = this.themed('Image_16x.svg');
    readonly layer = this.themed('Layer_16x.svg');

    private themed(name: string): ThemedIcon {
        return {
            light: vscode.Uri.joinPath(this.extensionUri, 'resources', 'light', name),
            dark: vscode.Uri.joinPath(this.extensionUri, 'resources', 'dark', name)
        };
    }
}
