import * as vscode from 'vscode';
import { URL } from 'url';

import { PrivateDockerExplorerProvider } from './explorer/dockerExplorer';
import { CredentialStore } from './utils/credentialStore';
import { Icons } from './utils/icons';
import { LayerNode } from './models/layerNode';
import { TagNode } from './models/tagNode';
import { RegistryNode } from './models/registryNode';
import { RepositoryNode } from './models/repositoryNode';

export function activate(context: vscode.ExtensionContext): void {
    const credentialStore = new CredentialStore(context);
    const icons = new Icons(context.extensionUri);
    const explorer = new PrivateDockerExplorerProvider(credentialStore, icons);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('dockerRegistryExplorer', explorer),

        vscode.commands.registerCommand('dockerRegistryExplorer.refreshEntry', () => explorer.refresh()),

        vscode.commands.registerCommand('dockerRegistryExplorer.addEntry', () => addRegistry(credentialStore, explorer)),

        vscode.commands.registerCommand('dockerRegistryExplorer.registryNode.refreshEntry',
            (node: RegistryNode) => node.refresh()),

        vscode.commands.registerCommand('dockerRegistryExplorer.registryNode.deleteEntry',
            (node: RegistryNode) => deleteRegistry(node, credentialStore, explorer)),

        vscode.commands.registerCommand('dockerRegistryExplorer.repositoryNode.refreshEntry',
            (node: RepositoryNode) => node.refresh()),

        vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.copyName',
            (node: TagNode) => copyToClipboard(node.getImageName(), 'image name')),

        vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.pullImage',
            (node: TagNode) => runDockerCommand(`docker pull ${node.getImageName()}`, 'pull image')),

        vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.removeLocalImage',
            (node: TagNode) => runDockerCommand(`docker rmi ${node.getImageName()}`, 'remove image')),

        vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.removeRemoteImage',
            (node: TagNode) => deleteRemoteImage(node)),

        vscode.commands.registerCommand('dockerRegistryExplorer.layerNode.copyDigest',
            (node: LayerNode) => copyToClipboard(node.layerItem.digest, 'digest value'))
    );
}

export function deactivate(): void {}

async function addRegistry(store: CredentialStore, explorer: PrivateDockerExplorerProvider): Promise<void> {
    const regUrl = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'https://myregistry.io',
        prompt: 'Registry url',
        validateInput: validateRegistryUrl
    });
    if (!regUrl) {
        return;
    }

    try {
        const url = new URL(regUrl).toString();
        const authChoice = await vscode.window.showQuickPick(
            [
                { label: 'Anonymous', description: 'No authentication' },
                { label: 'Basic', description: 'Username & password' }
            ],
            { ignoreFocusOut: true, placeHolder: `Authentication for ${url}` }
        );
        if (!authChoice) {
            return;
        }

        if (authChoice.label === 'Anonymous') {
            await store.addRegistry(url);
            explorer.refresh();
            return;
        }

        const user = await vscode.window.showInputBox({ ignoreFocusOut: true, prompt: `Username for ${url}` });
        if (!user) {
            return;
        }
        const password = await vscode.window.showInputBox({ ignoreFocusOut: true, prompt: `Password for ${url}`, password: true });
        if (!password) {
            return;
        }

        await store.addRegistry(url, { user, password });
        explorer.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to add registry: ${formatError(error)}`);
    }
}

async function deleteRegistry(node: RegistryNode, store: CredentialStore, explorer: PrivateDockerExplorerProvider): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
        `Delete entry for '${node.key}'?`,
        { modal: true },
        'Yes'
    );
    if (confirm !== 'Yes') {
        return;
    }
    try {
        await store.removeRegistry(node.key);
        vscode.window.showInformationMessage(`Registry '${node.key}' removed.`);
        explorer.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to remove registry: ${formatError(error)}`);
    }
}

async function deleteRemoteImage(node: TagNode): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
        `Delete '${node.getImageName()}' from your docker repository?`,
        { modal: true },
        'Yes'
    );
    if (confirm !== 'Yes') {
        return;
    }
    try {
        const ok = await node.deleteFromRepository();
        if (!ok) {
            return;
        }
        const repo = node.parent as RepositoryNode | undefined;
        if (!repo) {
            return;
        }
        if (repo.childrenCount <= 1 && repo.parent) {
            repo.parent.refresh();
        } else {
            repo.refresh();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete image: ${formatError(error)}`);
    }
}

async function runDockerCommand(defaultCommand: string, action: string): Promise<void> {
    const command = await vscode.window.showInputBox({
        prompt: `Run this command to ${action}?`,
        value: defaultCommand
    });
    if (!command) {
        return;
    }
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(command, false);
}

async function copyToClipboard(text: string, label: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    vscode.window.setStatusBarMessage(`The ${label} "${text}" is copied to clipboard.`, 3000);
}

function validateRegistryUrl(value: string): string | undefined {
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return `URL must start with 'http://' or 'https://'.`;
        }
        return undefined;
    } catch {
        return `Please enter a valid url (A valid url begins with 'http://' or 'https://').`;
    }
}

function formatError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
