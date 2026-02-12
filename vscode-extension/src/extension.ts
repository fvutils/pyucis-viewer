import * as vscode from 'vscode';
import { DatabaseDiscovery } from './providers/database-discovery';
import { DatabaseManager } from './providers/database-manager';
import { DatabaseListProvider } from './providers/database-list-provider';
import { CoverageTreeProvider } from './providers/coverage-tree-provider';
import { CoverageDetailPanel } from './views/coverage-detail-panel';
import { CoverageDashboard } from './views/coverage-dashboard';
import { CoverageDecorationProvider } from './decorations/coverage-decoration-provider';
import { Scope, CoverItem } from './db/schema';
import * as path from 'path';

// Global instances
let discovery: DatabaseDiscovery;
let manager: DatabaseManager;
let databaseListProvider: DatabaseListProvider;
let coverageTreeProvider: CoverageTreeProvider;
let detailPanel: CoverageDetailPanel;
let dashboard: CoverageDashboard;
let decorationProvider: CoverageDecorationProvider;

/**
 * Extension activation entry point
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('PyUCIS Coverage Explorer is now active');

    // Initialize database discovery and management
    discovery = new DatabaseDiscovery(context);
    manager = new DatabaseManager();
    
    // Initialize providers
    databaseListProvider = new DatabaseListProvider(discovery, manager);
    coverageTreeProvider = new CoverageTreeProvider(manager, context);
    detailPanel = CoverageDetailPanel.getInstance(context);
    dashboard = CoverageDashboard.getInstance(context);
    decorationProvider = new CoverageDecorationProvider(manager, context);
    
    // Register tree views
    const databaseTreeView = vscode.window.createTreeView('pyucis.databases', {
        treeDataProvider: databaseListProvider,
        showCollapseAll: false
    });
    
    const coverageTreeView = vscode.window.createTreeView('pyucis.coverage', {
        treeDataProvider: coverageTreeProvider,
        showCollapseAll: true
    });
    
    context.subscriptions.push(databaseTreeView, coverageTreeView);

    // Start discovery
    await discovery.activate();

    // Register commands
    
    // Open database via file picker
    const openDatabaseCmd = vscode.commands.registerCommand('pyucis.openDatabase', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'UCIS Database': ['ucisdb'],
                'All Files': ['*']
            },
            title: 'Open UCIS Coverage Database'
        });

        if (fileUri && fileUri.length > 0) {
            const dbPath = fileUri[0].fsPath;
            const success = await manager.openDatabase(dbPath);
            if (success) {
                discovery.addDatabase(dbPath);
            }
        }
    });

    // Activate database (switch to it)
    const activateDatabaseCmd = vscode.commands.registerCommand('pyucis.activateDatabase', async (dbPath: string) => {
        if (manager.isOpen(dbPath)) {
            manager.setActiveDatabase(dbPath);
        } else {
            await manager.openDatabase(dbPath);
        }
    });

    // Refresh active database
    const refreshDatabaseCmd = vscode.commands.registerCommand('pyucis.refreshDatabase', async () => {
        const activePath = manager.getActiveDatabasePath();
        if (activePath) {
            await manager.refreshDatabase(activePath);
            vscode.window.showInformationMessage('Database refreshed');
        } else {
            vscode.window.showWarningMessage('No active database to refresh');
        }
    });

    // Rescan workspace for databases
    const rescanWorkspaceCmd = vscode.commands.registerCommand('pyucis.rescanWorkspace', async () => {
        await discovery.scanWorkspace();
        vscode.window.showInformationMessage('Workspace scanned for databases');
    });

    // Close database
    const closeDatabaseCmd = vscode.commands.registerCommand('pyucis.closeDatabase', async (dbPath?: string) => {
        const pathToClose = dbPath || manager.getActiveDatabasePath();
        if (pathToClose) {
            manager.closeDatabase(pathToClose);
            vscode.window.showInformationMessage('Database closed');
        }
    });

    // Show dashboard
    const showDashboardCmd = vscode.commands.registerCommand('pyucis.showDashboard', async () => {
        const queries = manager.getActiveQueries();
        const dbPath = manager.getActiveDatabasePath();
        
        if (!queries || !dbPath) {
            vscode.window.showWarningMessage('No active database. Please open a database first.');
            return;
        }
        
        const dbName = path.basename(dbPath);
        dashboard.showDashboard(queries, dbName);
    });

    // Show uncovered items
    const showUncoveredCmd = vscode.commands.registerCommand('pyucis.showUncovered', async () => {
        if (!manager.getActiveDatabase()) {
            vscode.window.showWarningMessage('No active database. Please open a database first.');
            return;
        }
        coverageTreeProvider.setFilter('uncovered');
        vscode.window.showInformationMessage('Showing uncovered items only');
    });

    // Show all items
    const showAllCmd = vscode.commands.registerCommand('pyucis.showAll', async () => {
        coverageTreeProvider.setFilter('all');
        vscode.window.showInformationMessage('Showing all items');
    });

    // Show covered items
    const showCoveredCmd = vscode.commands.registerCommand('pyucis.showCovered', async () => {
        if (!manager.getActiveDatabase()) {
            vscode.window.showWarningMessage('No active database. Please open a database first.');
            return;
        }
        coverageTreeProvider.setFilter('covered');
        vscode.window.showInformationMessage('Showing covered items only');
    });

    // Refresh coverage tree
    const refreshCoverageCmd = vscode.commands.registerCommand('pyucis.refreshCoverage', async () => {
        coverageTreeProvider.refresh();
    });

    // Show scope detail
    const showScopeDetailCmd = vscode.commands.registerCommand('pyucis.showScopeDetail', async (scope: Scope) => {
        const queries = manager.getActiveQueries();
        if (queries) {
            detailPanel.showScope(scope, queries);
        }
    });

    // Show bin detail
    const showBinDetailCmd = vscode.commands.registerCommand('pyucis.showBinDetail', async (bin: CoverItem, scopeName: string) => {
        const queries = manager.getActiveQueries();
        if (queries) {
            detailPanel.showBin(bin, scopeName, queries);
        }
    });

    // Search scopes (F4)
    const searchScopesCmd = vscode.commands.registerCommand('pyucis.searchScopes', async () => {
        const queries = manager.getActiveQueries();
        if (!queries) {
            vscode.window.showWarningMessage('No active database. Please open a database first.');
            return;
        }

        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Search for scopes by name',
            placeHolder: 'Enter scope name pattern...'
        });

        if (!searchTerm) {
            return;
        }

        // Get all scopes and filter by name
        const rootScopes = queries.getRootScopes();
        const allScopes: any[] = [...rootScopes];
        
        // Recursively get all scopes
        const collectScopes = (scopeId: number) => {
            const children = queries.getChildScopes(scopeId);
            for (const child of children) {
                allScopes.push(child);
                collectScopes(child.scope_id);
            }
        };
        
        for (const root of rootScopes) {
            collectScopes(root.scope_id);
        }

        // Filter by search term (case-insensitive)
        const matching = allScopes.filter(s => 
            s.scope_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matching.length === 0) {
            vscode.window.showInformationMessage(`No scopes found matching "${searchTerm}"`);
            return;
        }

        // Show quick pick
        const items = matching.map(s => ({
            label: s.scope_name,
            description: `ID: ${s.scope_id}`,
            scope: s
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `${matching.length} scope(s) found`
        });

        if (selected) {
            detailPanel.showScope(selected.scope, queries);
        }
    });

    // Toggle source decorations (F6)
    const toggleDecorationsCmd = vscode.commands.registerCommand('pyucis.toggleDecorations', async () => {
        decorationProvider.toggle();
        const status = decorationProvider.isEnabled() ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Source decorations ${status}`);
    });

    // Enable decorations
    const enableDecorationsCmd = vscode.commands.registerCommand('pyucis.enableDecorations', async () => {
        decorationProvider.enable();
        vscode.window.showInformationMessage('Source decorations enabled');
    });

    // Disable decorations
    const disableDecorationsCmd = vscode.commands.registerCommand('pyucis.disableDecorations', async () => {
        decorationProvider.disable();
        vscode.window.showInformationMessage('Source decorations disabled');
    });

    context.subscriptions.push(
        openDatabaseCmd,
        activateDatabaseCmd,
        refreshDatabaseCmd,
        rescanWorkspaceCmd,
        closeDatabaseCmd,
        showDashboardCmd,
        showUncoveredCmd,
        showAllCmd,
        showCoveredCmd,
        refreshCoverageCmd,
        showScopeDetailCmd,
        showBinDetailCmd,
        searchScopesCmd,
        toggleDecorationsCmd,
        enableDecorationsCmd,
        disableDecorationsCmd
    );

    console.log('PyUCIS Coverage Explorer ready!');
}

/**
 * Extension deactivation
 */
export function deactivate() {
    console.log('PyUCIS Coverage Explorer is now deactivated');
    
    // Cleanup
    if (discovery) {
        discovery.deactivate();
    }
    if (manager) {
        manager.closeAll();
    }
}
