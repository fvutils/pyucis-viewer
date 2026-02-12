import * as vscode from 'vscode';
import * as path from 'path';
import { DatabaseDiscovery } from './database-discovery';
import { DatabaseManager } from './database-manager';

/**
 * Tree item representing a database file
 */
class DatabaseItem extends vscode.TreeItem {
    constructor(
        public readonly dbPath: string,
        public readonly isOpen: boolean,
        public readonly isActive: boolean
    ) {
        super(path.basename(dbPath), vscode.TreeItemCollapsibleState.None);
        
        this.contextValue = 'database';
        this.tooltip = dbPath;
        this.description = isActive ? '(active)' : (isOpen ? '(open)' : '');
        
        // Icon based on state
        this.iconPath = new vscode.ThemeIcon(
            isActive ? 'database' : (isOpen ? 'circle-filled' : 'circle-outline')
        );

        // Command to open/activate database on click
        this.command = {
            command: 'pyucis.activateDatabase',
            title: 'Activate Database',
            arguments: [dbPath]
        };
    }
}

/**
 * Tree data provider for database list view
 */
export class DatabaseListProvider implements vscode.TreeDataProvider<DatabaseItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DatabaseItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private discovery: DatabaseDiscovery,
        private manager: DatabaseManager
    ) {
        // Listen for changes
        this.discovery.onDatabasesChanged(() => this.refresh());
        this.manager.onActiveDatabaseChanged(() => this.refresh());
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get tree item
     */
    getTreeItem(element: DatabaseItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children (root level = all databases)
     */
    async getChildren(element?: DatabaseItem): Promise<DatabaseItem[]> {
        if (element) {
            // No children for database items
            return [];
        }

        // Get all discovered databases
        const databases = this.discovery.getDatabases();
        const activePath = this.manager.getActiveDatabasePath();
        const openDatabases = this.manager.getOpenDatabases();

        return databases.map(dbPath => {
            const isOpen = openDatabases.includes(dbPath);
            const isActive = dbPath === activePath;
            return new DatabaseItem(dbPath, isOpen, isActive);
        });
    }

    /**
     * Get parent (always null for flat list)
     */
    getParent(_element: DatabaseItem): vscode.ProviderResult<DatabaseItem> {
        return null;
    }
}
