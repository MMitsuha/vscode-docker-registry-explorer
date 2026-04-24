import * as vscode from 'vscode';
import { URL } from 'url';

import { PrivateDockerExplorerProvider } from './explorer/dockerExplorer';
import { CredentialStore } from './utils/credentialStore';
import { Icons } from './utils/icons';
import { initLogger, log } from './utils/logger';
import { LayerNode } from './models/layerNode';
import { TagNode } from './models/tagNode';
import { RegistryNode } from './models/registryNode';
import { RepositoryNode } from './models/repositoryNode';

export function activate(context: vscode.ExtensionContext): void {
    const logger = initLogger();
    context.subscriptions.push({ dispose: () => logger.dispose() });

    try {
        logger.info('Activating Docker Registry Explorer');

        const credentialStore = new CredentialStore(context);
        const icons = new Icons(context.extensionUri);
        const explorer = new PrivateDockerExplorerProvider(credentialStore, icons);

        context.subscriptions.push(
            vscode.window.registerTreeDataProvider('dockerRegistryExplorer', explorer),

            registerCommand('dockerRegistryExplorer.refreshEntry',
                async () => { explorer.refresh(); }),

            registerCommand('dockerRegistryExplorer.addEntry',
                () => addRegistry(credentialStore, explorer)),

            registerCommand('dockerRegistryExplorer.registryNode.refreshEntry',
                async (node: RegistryNode) => { node.refresh(); }),

            registerCommand('dockerRegistryExplorer.registryNode.deleteEntry',
                (node: RegistryNode) => deleteRegistry(node, credentialStore, explorer)),

            registerCommand('dockerRegistryExplorer.repositoryNode.refreshEntry',
                async (node: RepositoryNode) => { node.refresh(); }),

            registerCommand('dockerRegistryExplorer.tagNode.copyName',
                (node: TagNode) => copyToClipboard(node.getImageName(), 'image name')),

            registerCommand('dockerRegistryExplorer.tagNode.pullImage',
                (node: TagNode) => runDockerCommand(`docker pull ${node.getImageName()}`, 'pull image')),

            registerCommand('dockerRegistryExplorer.tagNode.removeLocalImage',
                (node: TagNode) => runDockerCommand(`docker rmi ${node.getImageName()}`, 'remove image')),

            registerCommand('dockerRegistryExplorer.tagNode.removeRemoteImage',
                (node: TagNode) => deleteRemoteImage(node)),

            registerCommand('dockerRegistryExplorer.layerNode.copyDigest',
                (node: LayerNode) => copyToClipboard(node.layerItem.digest, 'digest value')),

            registerCommand('dockerRegistryExplorer.showLogs',
                async () => { log().show(); })
        );

        logger.info(`Activation complete. ${credentialStore.listRegistries().length} registries loaded from globalState.`);
    } catch (error) {
        logger.error('Activation failed', error);
        vscode.window.showErrorMessage(`Docker Registry Explorer failed to activate: ${formatError(error)}`);
        throw error;
    }
}

export function deactivate(): void {
    log().info('Deactivating');
}

function registerCommand(id: string, handler: (...args: any[]) => Promise<unknown>): vscode.Disposable {
    return vscode.commands.registerCommand(id, async (...args: any[]) => {
        log().info(`Command invoked: ${id}`);
        try {
            return await handler(...args);
        } catch (error) {
            log().error(`Command '${id}' threw`, error);
            vscode.window.showErrorMessage(`${id}: ${formatError(error)}`);
        }
    });
}

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

    const url = new URL(regUrl).toString();
    log().info(`Adding registry ${url}`);

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
        log().info(`Registry added (anonymous): ${url}`);
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
    log().info(`Registry added (basic auth, user=${user}): ${url}`);
    explorer.refresh();
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
    await store.removeRegistry(node.key);
    log().info(`Registry removed: ${node.key}`);
    vscode.window.showInformationMessage(`Registry '${node.key}' removed.`);
    explorer.refresh();
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
    log().info(`Deleting remote image ${node.getImageName()}`);
    const ok = await node.deleteFromRepository();
    if (!ok) {
        return;
    }
    log().info(`Deleted remote image ${node.getImageName()}`);
    const repo = node.parent as RepositoryNode | undefined;
    if (!repo) {
        return;
    }
    if (repo.childrenCount <= 1 && repo.parent) {
        repo.parent.refresh();
    } else {
        repo.refresh();
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
