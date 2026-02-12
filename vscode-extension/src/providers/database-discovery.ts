import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Discovers and tracks .ucisdb files in the workspace
 */
export class DatabaseDiscovery {
    private databases: Set<string> = new Set();
    private watcher: vscode.FileSystemWatcher | undefined;
    private _onDatabasesChanged = new vscode.EventEmitter<void>();
    
    public readonly onDatabasesChanged = this._onDatabasesChanged.event;

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Start watching for database files
     */
    async activate(): Promise<void> {
        const config = vscode.workspace.getConfiguration('pyucis');
        const autoDetect = config.get<boolean>('autoDetect', true);

        if (!autoDetect) {
            console.log('Auto-detect disabled, skipping database discovery');
            return;
        }

        // Initial scan
        await this.scanWorkspace();

        // Setup file watcher
        this.setupWatcher();
    }

    /**
     * Stop watching
     */
    deactivate(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = undefined;
        }
        this._onDatabasesChanged.dispose();
    }

    /**
     * Scan workspace for database files
     */
    async scanWorkspace(): Promise<void> {
        const config = vscode.workspace.getConfiguration('pyucis');
        const patterns = config.get<string[]>('filePatterns', ['**/*.ucisdb']);

        console.log('Scanning workspace for databases with patterns:', patterns);

        const previousCount = this.databases.size;
        this.databases.clear();

        for (const pattern of patterns) {
            const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
            
            for (const file of files) {
                this.databases.add(file.fsPath);
            }
        }

        console.log(`Found ${this.databases.size} database(s)`);

        if (this.databases.size !== previousCount) {
            this._onDatabasesChanged.fire();
        }
    }

    /**
     * Setup file system watcher
     */
    private setupWatcher(): void {
        const config = vscode.workspace.getConfiguration('pyucis');
        const patterns = config.get<string[]>('filePatterns', ['**/*.ucisdb']);

        // Watch for .ucisdb files
        // Using the first pattern, or all if we want to watch multiple patterns
        const pattern = patterns.length > 0 ? patterns[0] : '**/*.ucisdb';
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

        this.watcher.onDidCreate(uri => {
            console.log('Database created:', uri.fsPath);
            this.databases.add(uri.fsPath);
            this._onDatabasesChanged.fire();
        });

        this.watcher.onDidDelete(uri => {
            console.log('Database deleted:', uri.fsPath);
            this.databases.delete(uri.fsPath);
            this._onDatabasesChanged.fire();
        });

        this.watcher.onDidChange(uri => {
            console.log('Database changed:', uri.fsPath);
            // Fire event so views can refresh if needed
            this._onDatabasesChanged.fire();
        });

        this.context.subscriptions.push(this.watcher);
    }

    /**
     * Get all discovered databases
     */
    getDatabases(): string[] {
        return Array.from(this.databases).sort();
    }

    /**
     * Check if a database exists in the discovered list
     */
    hasDatabase(dbPath: string): boolean {
        return this.databases.has(dbPath);
    }

    /**
     * Manually add a database (e.g., opened via file picker)
     */
    addDatabase(dbPath: string): void {
        if (!this.databases.has(dbPath)) {
            this.databases.add(dbPath);
            this._onDatabasesChanged.fire();
        }
    }

    /**
     * Get relative path for display
     */
    getDisplayPath(dbPath: string): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            return path.basename(dbPath);
        }

        // Try to find which workspace folder contains this file
        for (const folder of workspaceFolders) {
            if (dbPath.startsWith(folder.uri.fsPath)) {
                const relativePath = path.relative(folder.uri.fsPath, dbPath);
                return relativePath;
            }
        }

        // Not in workspace, return basename
        return path.basename(dbPath);
    }
}
