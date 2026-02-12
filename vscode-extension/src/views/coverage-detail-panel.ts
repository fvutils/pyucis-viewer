import * as vscode from 'vscode';
import { WebviewPanelManager } from './webview-base';
import { Scope, ScopeType, CoverItem } from '../db/schema';
import { UcisQueries } from '../db/queries';

/**
 * Detail panel for coverage scopes and bins
 */
export class CoverageDetailPanel extends WebviewPanelManager {
    private static instance: CoverageDetailPanel | undefined;
    
    private constructor(context: vscode.ExtensionContext) {
        super(context, 'pyucis.detail', 'Coverage Detail');
    }

    public static getInstance(context: vscode.ExtensionContext): CoverageDetailPanel {
        if (!CoverageDetailPanel.instance) {
            CoverageDetailPanel.instance = new CoverageDetailPanel(context);
        }
        return CoverageDetailPanel.instance;
    }

    /**
     * Show scope details
     */
    public showScope(scope: Scope, queries: UcisQueries): void {
        this.show();
        
        const html = this.generateScopeHtml(scope, queries);
        if (this.panel) {
            this.panel.webview.html = html;
            this.panel.title = `${ScopeType[scope.scope_type]}: ${scope.scope_name}`;
        }
    }

    /**
     * Show bin details
     */
    public showBin(bin: CoverItem, scopeName: string, queries: UcisQueries): void {
        this.show();
        
        const html = this.generateBinHtml(bin, scopeName, queries);
        if (this.panel) {
            this.panel.webview.html = html;
            this.panel.title = `Bin: ${bin.cover_name}`;
        }
    }

    public update(data: any): void {
        // Not used - we call showScope/showBin directly
    }

    /**
     * Generate HTML for scope details
     */
    private generateScopeHtml(scope: Scope, queries: UcisQueries): string {
        let content = '';

        // Header
        content += `<h1>${this.escapeHtml(scope.scope_name)}</h1>`;
        content += `<p><strong>Type:</strong> ${ScopeType[scope.scope_type]}</p>`;

        // Coverage metrics for coverpoints and crosses
        if (scope.scope_type === ScopeType.COVERPOINT || scope.scope_type === ScopeType.CROSS) {
            const coverage = queries.calculateCoverage(scope.scope_id);
            const cssClass = this.getCoverageClass(coverage.percentage);
            
            content += `<div class="coverage-header">`;
            content += `<div>`;
            content += `<h2>Coverage</h2>`;
            content += `<div class="coverage-percentage ${cssClass}">${this.formatPercentage(coverage.percentage)}</div>`;
            content += `<p>${coverage.covered} / ${coverage.total} bins covered</p>`;
            content += `</div>`;
            content += `</div>`;
            
            content += `<div class="progress-bar">`;
            content += `<div class="progress-fill ${cssClass}" style="width: ${coverage.percentage}%">`;
            if (coverage.percentage > 10) {
                content += this.formatPercentage(coverage.percentage);
            }
            content += `</div>`;
            content += `</div>`;
        }

        // Metadata
        content += `<div class="metadata">`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">Scope ID:</span>`;
        content += `<span class="metadata-value">${scope.scope_id}</span>`;
        content += `</div>`;
        
        if (scope.weight !== 1) {
            content += `<div class="metadata-row">`;
            content += `<span class="metadata-label">Weight:</span>`;
            content += `<span class="metadata-value">${scope.weight}</span>`;
            content += `</div>`;
        }
        
        if (scope.at_least > 1) {
            content += `<div class="metadata-row">`;
            content += `<span class="metadata-label">At Least:</span>`;
            content += `<span class="metadata-value">${scope.at_least}</span>`;
            content += `</div>`;
        }
        
        if (scope.source_id !== null) {
            content += `<div class="metadata-row">`;
            content += `<span class="metadata-label">Source File:</span>`;
            const fileRef = queries.getFile(scope.source_id);
            if (fileRef) {
                content += `<span class="metadata-value">${this.escapeHtml(fileRef.path)}`;
                if (scope.line !== null) {
                    content += `:${scope.line}`;
                }
                content += `</span>`;
            } else {
                content += `<span class="metadata-value">File ID: ${scope.source_id}</span>`;
            }
            content += `</div>`;
        }
        content += `</div>`;

        // Child scopes
        const childScopes = queries.getChildScopes(scope.scope_id);
        if (childScopes.length > 0) {
            content += `<div class="section">`;
            content += `<h2>Child Scopes (${childScopes.length})</h2>`;
            content += `<table>`;
            content += `<tr><th>Name</th><th>Type</th><th>Weight</th></tr>`;
            
            for (const child of childScopes) {
                content += `<tr>`;
                content += `<td>${this.escapeHtml(child.scope_name)}</td>`;
                content += `<td>${ScopeType[child.scope_type]}</td>`;
                content += `<td>${child.weight}</td>`;
                content += `</tr>`;
            }
            
            content += `</table>`;
            content += `</div>`;
        }

        // Bins for coverpoints and crosses
        if (scope.scope_type === ScopeType.COVERPOINT || scope.scope_type === ScopeType.CROSS) {
            const bins = queries.getCoverItems(scope.scope_id);
            
            if (bins.length > 0) {
                content += `<div class="section">`;
                content += `<h2>Bins (${bins.length})</h2>`;
                content += `<table>`;
                content += `<tr><th>Name</th><th>Hit Count</th><th>Goal</th><th>Status</th><th>Weight</th></tr>`;
                
                for (const bin of bins) {
                    const isCovered = bin.cover_data >= bin.at_least;
                    const statusClass = isCovered ? 'status-covered' : 'status-uncovered';
                    const status = isCovered ? '✓ Covered' : '✗ Uncovered';
                    
                    content += `<tr>`;
                    content += `<td>${this.escapeHtml(bin.cover_name)}</td>`;
                    content += `<td><strong>${bin.cover_data}</strong></td>`;
                    content += `<td>${bin.at_least}</td>`;
                    content += `<td class="${statusClass}">${status}</td>`;
                    content += `<td>${bin.weight}</td>`;
                    content += `</tr>`;
                }
                
                content += `</table>`;
                content += `</div>`;
            }
        }

        return this.getBaseHtml(content);
    }

    /**
     * Generate HTML for bin details
     */
    private generateBinHtml(bin: CoverItem, scopeName: string, queries: UcisQueries): string {
        const isCovered = bin.cover_data >= bin.at_least;
        const percentage = bin.at_least > 0 ? (Math.min(bin.cover_data / bin.at_least, 1) * 100) : 0;
        const cssClass = isCovered ? 'high' : 'low';
        
        let content = '';

        // Header
        content += `<h1>${this.escapeHtml(bin.cover_name)}</h1>`;
        content += `<p><strong>Scope:</strong> ${this.escapeHtml(scopeName)}</p>`;

        // Status badge
        if (isCovered) {
            content += `<span class="badge badge-covered">✓ COVERED</span>`;
        } else {
            content += `<span class="badge badge-uncovered">✗ UNCOVERED</span>`;
        }

        // Hit count
        content += `<div class="coverage-header">`;
        content += `<div>`;
        content += `<h2>Hit Count</h2>`;
        content += `<div class="coverage-percentage ${cssClass}">${bin.cover_data} / ${bin.at_least}</div>`;
        content += `</div>`;
        content += `</div>`;

        content += `<div class="progress-bar">`;
        content += `<div class="progress-fill ${cssClass}" style="width: ${percentage}%">`;
        if (percentage > 10) {
            content += `${bin.cover_data} hits`;
        }
        content += `</div>`;
        content += `</div>`;

        // Metadata
        content += `<div class="metadata">`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">Cover ID:</span>`;
        content += `<span class="metadata-value">${bin.cover_id}</span>`;
        content += `</div>`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">Index:</span>`;
        content += `<span class="metadata-value">${bin.cover_index}</span>`;
        content += `</div>`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">Weight:</span>`;
        content += `<span class="metadata-value">${bin.weight}</span>`;
        content += `</div>`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">Goal (at_least):</span>`;
        content += `<span class="metadata-value">${bin.at_least}</span>`;
        content += `</div>`;
        content += `</div>`;

        // Contributing tests
        try {
            const tests = queries.getTestsForBin(bin.cover_id);
            
            if (tests.length > 0) {
                content += `<div class="section">`;
                content += `<h2>Contributing Tests (${tests.length})</h2>`;
                content += `<table>`;
                content += `<tr><th>Test Name</th><th>Contribution</th><th>Status</th></tr>`;
                
                for (const test of tests) {
                    const statusText = test.test_status === 0 ? 'Passed' : `Status ${test.test_status}`;
                    content += `<tr>`;
                    content += `<td>${this.escapeHtml(test.test_name)}</td>`;
                    content += `<td><strong>${test.contribution}</strong></td>`;
                    content += `<td>${statusText}</td>`;
                    content += `</tr>`;
                }
                
                content += `</table>`;
                content += `</div>`;
            } else if (bin.cover_data > 0) {
                content += `<div class="section">`;
                content += `<p class="empty-message">No test history available</p>`;
                content += `</div>`;
            }
        } catch (error) {
            console.error('Error getting test data:', error);
        }

        return this.getBaseHtml(content);
    }

    /**
     * Escape HTML
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
