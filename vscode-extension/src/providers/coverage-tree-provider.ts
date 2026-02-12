import * as vscode from 'vscode';
import { Scope, ScopeType, CoverItem, CoverType } from '../db/schema';
import { DatabaseManager } from './database-manager';
import { UcisQueries } from '../db/queries';
import { CoverageDetailPanel } from '../views/coverage-detail-panel';

/**
 * Base class for coverage tree items
 */
abstract class CoverageTreeItem extends vscode.TreeItem {
    abstract readonly itemType: 'scope' | 'bin';
}

/**
 * Tree item representing a coverage scope
 */
class ScopeTreeItem extends CoverageTreeItem {
    readonly itemType = 'scope' as const;
    
    constructor(
        public readonly scope: Scope,
        public readonly coverage?: { total: number; covered: number; percentage: number },
        private readonly context?: vscode.ExtensionContext
    ) {
        super(
            scope.scope_name,
            vscode.TreeItemCollapsibleState.Collapsed
        );

        this.contextValue = `scope-${ScopeType[scope.scope_type]}`.toLowerCase();
        this.id = `scope-${scope.scope_id}`;
        
        // Set icon based on scope type
        this.iconPath = this.getIconForScopeType(scope.scope_type);
        
        // Set description with coverage percentage
        if (coverage) {
            this.description = `(${coverage.percentage.toFixed(1)}%)`;
        }

        // Set tooltip
        this.tooltip = this.buildTooltip();

        // Command to show details when clicked
        if (context) {
            this.command = {
                command: 'pyucis.showScopeDetail',
                title: 'Show Scope Details',
                arguments: [scope]
            };
        }
    }

    private getIconForScopeType(scopeType: ScopeType): vscode.ThemeIcon {
        const iconMap: Record<ScopeType, string> = {
            [ScopeType.INSTANCE]: 'package',
            [ScopeType.COVERGROUP]: 'graph',
            [ScopeType.COVERPOINT]: 'graph-line',
            [ScopeType.CROSS]: 'symbol-operator',
            [ScopeType.TOGGLE]: 'symbol-boolean',
            [ScopeType.BRANCH]: 'git-branch',
            [ScopeType.EXPRESSION]: 'symbol-numeric',
            [ScopeType.FSM]: 'symbol-enum',
            [ScopeType.ASSERTION]: 'shield'
        };

        const iconName = iconMap[scopeType] || 'symbol-misc';
        
        // Color based on coverage
        let color: vscode.ThemeColor | undefined;
        if (this.coverage) {
            if (this.coverage.percentage >= 100) {
                color = new vscode.ThemeColor('testing.iconPassed');
            } else if (this.coverage.percentage >= 80) {
                color = new vscode.ThemeColor('testing.iconQueued');
            } else if (this.coverage.percentage > 0) {
                color = new vscode.ThemeColor('testing.iconFailed');
            } else {
                color = new vscode.ThemeColor('testing.iconErrored');
            }
        }

        return new vscode.ThemeIcon(iconName, color);
    }

    private buildTooltip(): string {
        let tooltip = `${ScopeType[this.scope.scope_type]}: ${this.scope.scope_name}`;
        
        if (this.coverage) {
            tooltip += `\n\nCoverage: ${this.coverage.covered}/${this.coverage.total} (${this.coverage.percentage.toFixed(1)}%)`;
        }
        
        if (this.scope.weight !== 1) {
            tooltip += `\nWeight: ${this.scope.weight}`;
        }

        return tooltip;
    }
}

/**
 * Tree item representing a coverage bin
 */
class BinTreeItem extends CoverageTreeItem {
    readonly itemType = 'bin' as const;

    constructor(
        public readonly bin: CoverItem,
        public readonly scopeName: string,
        private readonly context?: vscode.ExtensionContext
    ) {
        super(bin.cover_name, vscode.TreeItemCollapsibleState.None);

        this.contextValue = `bin-${CoverType[bin.cover_type]}`.toLowerCase();
        this.id = `bin-${bin.cover_id}`;

        // Icon based on coverage status
        const isCovered = bin.cover_data >= bin.at_least;
        this.iconPath = new vscode.ThemeIcon(
            isCovered ? 'pass' : 'circle-outline',
            isCovered 
                ? new vscode.ThemeColor('testing.iconPassed')
                : new vscode.ThemeColor('testing.iconFailed')
        );

        // Description with hit count
        this.description = `[${bin.cover_data}/${bin.at_least}]`;

        // Tooltip
        this.tooltip = this.buildTooltip();

        // Command to show details when clicked
        if (context) {
            this.command = {
                command: 'pyucis.showBinDetail',
                title: 'Show Bin Details',
                arguments: [bin, scopeName]
            };
        }
    }

    private buildTooltip(): string {
        const status = this.bin.cover_data >= this.bin.at_least ? 'Covered' : 'Uncovered';
        let tooltip = `${this.bin.cover_name}\n`;
        tooltip += `Status: ${status}\n`;
        tooltip += `Hit Count: ${this.bin.cover_data}\n`;
        tooltip += `Goal: ${this.bin.at_least}`;
        
        if (this.bin.weight !== 1) {
            tooltip += `\nWeight: ${this.bin.weight}`;
        }

        return tooltip;
    }
}

/**
 * Tree data provider for coverage hierarchy
 */
export class CoverageTreeProvider implements vscode.TreeDataProvider<CoverageTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<CoverageTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private currentFilter: 'all' | 'uncovered' | 'covered' = 'all';

    constructor(
        private manager: DatabaseManager,
        private context: vscode.ExtensionContext
    ) {
        // Listen for active database changes
        this.manager.onActiveDatabaseChanged(() => this.refresh());
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Set filter
     */
    setFilter(filter: 'all' | 'uncovered' | 'covered'): void {
        this.currentFilter = filter;
        this.refresh();
    }

    /**
     * Get tree item
     */
    getTreeItem(element: CoverageTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children
     */
    async getChildren(element?: CoverageTreeItem): Promise<CoverageTreeItem[]> {
        const queries = this.manager.getActiveQueries();
        
        if (!queries) {
            return [];
        }

        try {
            if (!element) {
                // Root level - get root scopes
                return await this.getRootItems(queries);
            } else if (element instanceof ScopeTreeItem) {
                // Get children of scope
                return await this.getScopeChildren(element, queries);
            } else {
                // Bins have no children
                return [];
            }
        } catch (error) {
            console.error('Error getting tree children:', error);
            vscode.window.showErrorMessage(`Error loading coverage data: ${error}`);
            return [];
        }
    }

    /**
     * Get parent
     */
    getParent(element: CoverageTreeItem): vscode.ProviderResult<CoverageTreeItem> {
        // TODO: Implement parent tracking for breadcrumb navigation
        return null;
    }

    /**
     * Get root items (top-level scopes)
     */
    private async getRootItems(queries: UcisQueries): Promise<CoverageTreeItem[]> {
        const rootScopes = queries.getRootScopes();
        const items: ScopeTreeItem[] = [];

        for (const scope of rootScopes) {
            const coverage = this.calculateScopeCoverage(scope, queries);
            
            // Apply filter
            if (this.shouldIncludeScope(coverage)) {
                items.push(new ScopeTreeItem(scope, coverage, this.context));
            }
        }

        return items;
    }

    /**
     * Get children of a scope
     */
    private async getScopeChildren(scopeItem: ScopeTreeItem, queries: UcisQueries): Promise<CoverageTreeItem[]> {
        const items: CoverageTreeItem[] = [];
        const scope = scopeItem.scope;

        // Get child scopes
        const childScopes = queries.getChildScopes(scope.scope_id);
        for (const childScope of childScopes) {
            const coverage = this.calculateScopeCoverage(childScope, queries);
            
            if (this.shouldIncludeScope(coverage)) {
                items.push(new ScopeTreeItem(childScope, coverage, this.context));
            }
        }

        // For coverpoints and crosses, also show bins
        if (scope.scope_type === ScopeType.COVERPOINT || scope.scope_type === ScopeType.CROSS) {
            const config = vscode.workspace.getConfiguration('pyucis');
            const excludeIgnored = config.get<boolean>('excludeIgnoredBins', true);
            const excludeIllegal = config.get<boolean>('excludeIllegalBins', true);
            
            const bins = queries.getCoverageBins(scope.scope_id, excludeIgnored, excludeIllegal);
            
            for (const bin of bins) {
                if (this.shouldIncludeBin(bin)) {
                    items.push(new BinTreeItem(bin, scope.scope_name, this.context));
                }
            }
        }

        return items;
    }

    /**
     * Calculate coverage for a scope
     */
    private calculateScopeCoverage(scope: Scope, queries: UcisQueries): { total: number; covered: number; percentage: number } | undefined {
        // Only calculate for scopes that have coverage bins
        if (scope.scope_type === ScopeType.COVERPOINT || scope.scope_type === ScopeType.CROSS) {
            const config = vscode.workspace.getConfiguration('pyucis');
            const excludeIgnored = config.get<boolean>('excludeIgnoredBins', true);
            const excludeIllegal = config.get<boolean>('excludeIllegalBins', true);
            
            return queries.calculateCoverage(scope.scope_id, excludeIgnored, excludeIllegal);
        }

        // For other scopes (instances, covergroups), would need recursive calculation
        // For now, return undefined
        return undefined;
    }

    /**
     * Check if scope should be included based on filter
     */
    private shouldIncludeScope(coverage?: { total: number; covered: number; percentage: number }): boolean {
        if (this.currentFilter === 'all') {
            return true;
        }

        if (!coverage) {
            return true; // Include scopes without direct coverage (like instances)
        }

        if (this.currentFilter === 'uncovered') {
            return coverage.percentage < 100;
        } else if (this.currentFilter === 'covered') {
            return coverage.percentage === 100;
        }

        return true;
    }

    /**
     * Check if bin should be included based on filter
     */
    private shouldIncludeBin(bin: CoverItem): boolean {
        if (this.currentFilter === 'all') {
            return true;
        }

        const isCovered = bin.cover_data >= bin.at_least;

        if (this.currentFilter === 'uncovered') {
            return !isCovered;
        } else if (this.currentFilter === 'covered') {
            return isCovered;
        }

        return true;
    }
}
