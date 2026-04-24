import * as vscode from 'vscode';

export class Logger {
    private readonly channel: vscode.OutputChannel;
    private autoShown = false;

    constructor() {
        this.channel = vscode.window.createOutputChannel('Docker Registry Explorer');
    }

    info(message: string): void {
        this.write('INFO', message);
    }

    warn(message: string): void {
        this.write('WARN', message);
    }

    error(context: string, error: unknown): void {
        const detail = error instanceof Error
            ? (error.stack ?? `${error.name}: ${error.message}`)
            : String(error);
        this.write('ERROR', `${context}\n    ${detail.replace(/\n/g, '\n    ')}`);
        if (!this.autoShown) {
            this.autoShown = true;
            this.channel.show(true);
        }
    }

    show(): void {
        this.channel.show(true);
    }

    dispose(): void {
        this.channel.dispose();
    }

    private write(level: string, message: string): void {
        const ts = new Date().toISOString();
        const line = `[${ts}] [${level}] ${message}`;
        this.channel.appendLine(line);
        if (level === 'ERROR') {
            console.error(`[docker-registry-explorer] ${message}`);
        } else {
            console.log(`[docker-registry-explorer] ${message}`);
        }
    }
}

let shared: Logger | undefined;

export function initLogger(): Logger {
    if (!shared) {
        shared = new Logger();
    }
    return shared;
}

export function log(): Logger {
    if (!shared) {
        shared = new Logger();
    }
    return shared;
}
