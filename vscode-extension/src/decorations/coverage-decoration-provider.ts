import * as vscode from 'vscode';
import { DatabaseManager } from '../providers/database-manager';
import { PathMapper } from './path-mapper';
import { Scope, ScopeType } from '../db/schema';

/**
 * Line coverage information
 */
interface LineCoverage {
    line: number;
    hitCount: number;
    isCovered: boolean;
    scopeId: number;
    scopeName: string;
}

/**
 * Manages source code coverage decorations
 */
export class CoverageDecorationProvider {
    private coveredDecorationType: vscode.TextEditorDecorationType;
    private uncoveredDecorationType: vscode.TextEditorDecorationType;
    private enabled: boolean = false;
    private pathMapper: PathMapper;
    private fileDecorations = new Map<string, LineCoverage[]>();

    constructor(
        private manager: DatabaseManager,
        private context: vscode.ExtensionContext
    ) {
        this.pathMapper = new PathMapper();
        
        // Create decoration types with simple styles
        this.coveredDecorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: false,
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            overviewRulerColor: 'green',
            overviewRulerLane: vscode.OverviewRulerLane.Left
        });

        this.uncoveredDecorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: false,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            overviewRulerColor: 'red',
            overviewRulerLane: vscode.OverviewRulerLane.Left
        });

        // Load initial state
        const config = vscode.workspace.getConfiguration('pyucis');
        this.enabled = config.get<boolean>('showDecorations', false);

        // Register listeners
        this.context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor && this.enabled) {
                    this.updateDecorations(editor);
                }
            }),
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('pyucis.showDecorations')) {
                    this.reload();
                } else if (e.affectsConfiguration('pyucis.pathMappings')) {
                    this.pathMapper.reload();
                    this.refreshAll();
                }
            }),
            this.manager.onActiveDatabaseChanged(() => {
                if (this.enabled) {
                    this.refreshAll();
                }
            }),
            this.coveredDecorationType,
            this.uncoveredDecorationType
        );
    }

    /**
     * Enable decorations
     */
    enable(): void {
        this.enabled = true;
        this.refreshAll();
    }

    /**
     * Disable decorations
     */
    disable(): void {
        this.enabled = false;
        this.clearAll();
    }

    /**
     * Toggle decorations
     */
    toggle(): void {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Check if decorations are enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Reload configuration and refresh
     */
    private reload(): void {
        const config = vscode.workspace.getConfiguration('pyucis');
        this.enabled = config.get<boolean>('showDecorations', false);
        
        if (this.enabled) {
            this.refreshAll();
        } else {
            this.clearAll();
        }
    }

    /**
     * Refresh all visible editors
     */
    refreshAll(): void {
        this.fileDecorations.clear();
        
        for (const editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
    }

    /**
     * Clear all decorations
     */
    private clearAll(): void {
        for (const editor of vscode.window.visibleTextEditors) {
            editor.setDecorations(this.coveredDecorationType, []);
            editor.setDecorations(this.uncoveredDecorationType, []);
        }
    }

    /**
     * Update decorations for an editor
     */
    private async updateDecorations(editor: vscode.TextEditor): Promise<void> {
        if (!this.enabled) {
            return;
        }

        const queries = this.manager.getActiveQueries();
        if (!queries) {
            return;
        }

        const fileUri = editor.document.uri;
        const filePath = fileUri.fsPath;

        // Get or compute coverage for this file
        let coverage = this.fileDecorations.get(filePath);
        if (!coverage) {
            coverage = await this.computeFileCoverage(fileUri);
            this.fileDecorations.set(filePath, coverage);
        }

        // Create decorations
        const coveredRanges: vscode.DecorationOptions[] = [];
        const uncoveredRanges: vscode.DecorationOptions[] = [];

        for (const lineCov of coverage) {
            const lineIndex = lineCov.line - 1; // Convert to 0-based
            if (lineIndex < 0 || lineIndex >= editor.document.lineCount) {
                continue;
            }

            const line = editor.document.lineAt(lineIndex);
            const range = line.range;

            const hoverMessage = new vscode.MarkdownString();
            hoverMessage.appendMarkdown(`**${lineCov.scopeName}**\n\n`);
            hoverMessage.appendMarkdown(`Hit Count: **${lineCov.hitCount}**\n\n`);
            hoverMessage.appendMarkdown(lineCov.isCovered ? '✓ Covered' : '✗ Uncovered');

            const decoration: vscode.DecorationOptions = {
                range,
                hoverMessage
            };

            if (lineCov.isCovered) {
                coveredRanges.push(decoration);
            } else {
                uncoveredRanges.push(decoration);
            }
        }

        editor.setDecorations(this.coveredDecorationType, coveredRanges);
        editor.setDecorations(this.uncoveredDecorationType, uncoveredRanges);
    }

    /**
     * Compute coverage for a file
     */
    private async computeFileCoverage(fileUri: vscode.Uri): Promise<LineCoverage[]> {
        const queries = this.manager.getActiveQueries();
        if (!queries) {
            return [];
        }

        const coverage: LineCoverage[] = [];

        // Get all scopes with source references
        const rootScopes = queries.getRootScopes();
        const allScopes: Scope[] = [...rootScopes];

        // Recursively collect all scopes
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

        // Find scopes that reference this file
        for (const scope of allScopes) {
            if (scope.source_id !== null && scope.line !== null) {
                const fileRef = queries.getFile(scope.source_id);
                if (fileRef) {
                    const scopeUri = this.pathMapper.resolve(fileRef.path);
                    if (scopeUri && scopeUri.fsPath === fileUri.fsPath) {
                        // This scope references our file
                        // For code coverage (branch, toggle, etc.), get bins
                        if (scope.scope_type === ScopeType.BRANCH ||
                            scope.scope_type === ScopeType.TOGGLE ||
                            scope.scope_type === ScopeType.EXPRESSION) {
                            
                            const bins = queries.getCoverItems(scope.scope_id);
                            const hitCount = bins.reduce((sum, bin) => sum + bin.cover_data, 0);
                            const isCovered = bins.some(bin => bin.cover_data > 0);

                            coverage.push({
                                line: scope.line,
                                hitCount,
                                isCovered,
                                scopeId: scope.scope_id,
                                scopeName: scope.scope_name
                            });
                        }
                    }
                }
            }
        }

        return coverage;
    }
}
