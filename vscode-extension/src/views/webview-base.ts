import * as vscode from 'vscode';

/**
 * Base webview panel manager
 */
export abstract class WebviewPanelManager {
    protected panel: vscode.WebviewPanel | undefined;
    
    constructor(
        protected readonly context: vscode.ExtensionContext,
        protected readonly viewType: string,
        protected readonly title: string
    ) {}

    /**
     * Show or create the panel
     */
    public show(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
        } else {
            this.createPanel();
        }
    }

    /**
     * Update panel content
     */
    public abstract update(data: any): void;

    /**
     * Create the webview panel
     */
    protected createPanel(): void {
        this.panel = vscode.window.createWebviewPanel(
            this.viewType,
            this.title,
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media')
                ]
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Handle messages from webview
     */
    protected handleMessage(message: any): void {
        // Override in subclasses
        console.log('Received message from webview:', message);
    }

    /**
     * Post message to webview
     */
    protected postMessage(message: any): void {
        this.panel?.webview.postMessage(message);
    }

    /**
     * Get base HTML with styling
     */
    protected getBaseHtml(content: string): string {
        const nonce = this.getNonce();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel?.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>${this.title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        
        h1, h2, h3 {
            color: var(--vscode-foreground);
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        h1 { font-size: 24px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
        h2 { font-size: 20px; }
        h3 { font-size: 16px; }
        
        .coverage-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .coverage-percentage {
            font-size: 32px;
            font-weight: bold;
        }
        
        .coverage-percentage.high { color: var(--vscode-testing-iconPassed); }
        .coverage-percentage.medium { color: var(--vscode-testing-iconQueued); }
        .coverage-percentage.low { color: var(--vscode-testing-iconFailed); }
        
        .progress-bar {
            width: 100%;
            height: 24px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }
        
        .progress-fill.high { background-color: var(--vscode-testing-iconPassed); }
        .progress-fill.medium { background-color: var(--vscode-testing-iconQueued); }
        .progress-fill.low { background-color: var(--vscode-testing-iconFailed); }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background-color: var(--vscode-editor-background);
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid var(--vscode-panel-border);
        }
        
        th {
            background-color: var(--vscode-editor-selectionBackground);
            font-weight: bold;
        }
        
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .status-covered {
            color: var(--vscode-testing-iconPassed);
            font-weight: bold;
        }
        
        .status-uncovered {
            color: var(--vscode-testing-iconFailed);
            font-weight: bold;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            margin-right: 5px;
        }
        
        .badge-covered {
            background-color: var(--vscode-testing-iconPassed);
            color: white;
        }
        
        .badge-uncovered {
            background-color: var(--vscode-testing-iconFailed);
            color: white;
        }
        
        .metadata {
            background-color: var(--vscode-input-background);
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
        }
        
        .metadata-row {
            display: flex;
            margin: 5px 0;
        }
        
        .metadata-label {
            font-weight: bold;
            width: 150px;
        }
        
        .metadata-value {
            flex: 1;
        }
        
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            margin-right: 8px;
        }
        
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .section {
            margin: 25px 0;
        }
        
        .empty-message {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 20px;
            text-align: center;
        }
        
        .sortable {
            cursor: pointer;
            user-select: none;
        }
        
        .sortable:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    }

    /**
     * Generate nonce for CSP
     */
    protected getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * Get coverage level class
     */
    protected getCoverageClass(percentage: number): string {
        if (percentage >= 100) return 'high';
        if (percentage >= 80) return 'medium';
        return 'low';
    }

    /**
     * Format percentage
     */
    protected formatPercentage(percentage: number): string {
        return percentage.toFixed(1) + '%';
    }
}
