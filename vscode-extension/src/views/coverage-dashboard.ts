import * as vscode from 'vscode';
import { WebviewPanelManager } from './webview-base';
import { UcisQueries } from '../db/queries';
import { ScopeType } from '../db/schema';

/**
 * Coverage summary dashboard
 */
export class CoverageDashboard extends WebviewPanelManager {
    private static instance: CoverageDashboard | undefined;
    
    private constructor(context: vscode.ExtensionContext) {
        super(context, 'pyucis.dashboard', 'Coverage Dashboard');
    }

    public static getInstance(context: vscode.ExtensionContext): CoverageDashboard {
        if (!CoverageDashboard.instance) {
            CoverageDashboard.instance = new CoverageDashboard(context);
        }
        return CoverageDashboard.instance;
    }

    /**
     * Show dashboard with database summary
     */
    public showDashboard(queries: UcisQueries, dbName: string): void {
        this.show();
        
        const html = this.generateDashboardHtml(queries, dbName);
        if (this.panel) {
            this.panel.webview.html = html;
            this.panel.title = `Coverage Dashboard: ${dbName}`;
        }
    }

    public update(data: any): void {
        // Not used
    }

    /**
     * Generate dashboard HTML
     */
    private generateDashboardHtml(queries: UcisQueries, dbName: string): string {
        let content = '';

        // Header
        content += `<h1>Coverage Dashboard</h1>`;
        content += `<p><strong>Database:</strong> ${this.escapeHtml(dbName)}</p>`;

        // Get overall statistics
        const config = vscode.workspace.getConfiguration('pyucis');
        const excludeIgnored = config.get<boolean>('excludeIgnoredBins', true);
        const excludeIllegal = config.get<boolean>('excludeIllegalBins', true);
        
        const totalBins = queries.getTotalBinCount(excludeIgnored, excludeIllegal);
        const uncoveredBins = queries.getUncoveredBins(excludeIgnored, excludeIllegal);
        const coveredBins = totalBins - uncoveredBins.length;
        const overallPercentage = totalBins > 0 ? (coveredBins / totalBins) * 100 : 0;
        const cssClass = this.getCoverageClass(overallPercentage);

        // Overall coverage
        content += `<div class="section">`;
        content += `<h2>Overall Coverage</h2>`;
        content += `<div class="coverage-header">`;
        content += `<div class="coverage-percentage ${cssClass}">${this.formatPercentage(overallPercentage)}</div>`;
        content += `</div>`;
        content += `<div class="progress-bar">`;
        content += `<div class="progress-fill ${cssClass}" style="width: ${overallPercentage}%">`;
        if (overallPercentage > 10) {
            content += this.formatPercentage(overallPercentage);
        }
        content += `</div>`;
        content += `</div>`;
        content += `<p><strong>${coveredBins}</strong> / <strong>${totalBins}</strong> bins covered</p>`;
        content += `</div>`;

        // Coverage by scope type
        const scopeCounts = queries.getScopeCounts();
        if (scopeCounts.length > 0) {
            content += `<div class="section">`;
            content += `<h2>Scope Distribution</h2>`;
            content += `<table>`;
            content += `<tr><th>Scope Type</th><th>Count</th></tr>`;
            
            for (const { scope_type, count } of scopeCounts) {
                const typeName = ScopeType[scope_type] || `Type ${scope_type}`;
                content += `<tr>`;
                content += `<td>${typeName}</td>`;
                content += `<td><strong>${count}</strong></td>`;
                content += `</tr>`;
            }
            
            content += `</table>`;
            content += `</div>`;
        }

        // Top uncovered items
        if (uncoveredBins.length > 0) {
            const topCount = Math.min(20, uncoveredBins.length);
            content += `<div class="section">`;
            content += `<h2>Uncovered Bins (Top ${topCount} of ${uncoveredBins.length})</h2>`;
            content += `<table>`;
            content += `<tr><th>Scope</th><th>Bin Name</th><th>Hit Count</th><th>Goal</th></tr>`;
            
            for (let i = 0; i < topCount; i++) {
                const item = uncoveredBins[i];
                content += `<tr>`;
                content += `<td>${this.escapeHtml(item.scope_name)}</td>`;
                content += `<td>${this.escapeHtml(item.cover_name)}</td>`;
                content += `<td class="status-uncovered">${item.cover_data}</td>`;
                content += `<td>${item.at_least}</td>`;
                content += `</tr>`;
            }
            
            content += `</table>`;
            content += `</div>`;
        } else {
            content += `<div class="section">`;
            content += `<h2>🎉 Perfect Coverage!</h2>`;
            content += `<p class="empty-message">All bins are covered. Excellent work!</p>`;
            content += `</div>`;
        }

        // Coverage distribution
        const distribution = this.calculateDistribution(totalBins, overallPercentage);
        content += `<div class="section">`;
        content += `<h2>Coverage Distribution</h2>`;
        content += `<div class="metadata">`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">0% (Uncovered):</span>`;
        content += `<span class="metadata-value"><strong>${uncoveredBins.length}</strong> bins</span>`;
        content += `</div>`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">100% (Covered):</span>`;
        content += `<span class="metadata-value"><strong>${coveredBins}</strong> bins</span>`;
        content += `</div>`;
        content += `<div class="metadata-row">`;
        content += `<span class="metadata-label">Total:</span>`;
        content += `<span class="metadata-value"><strong>${totalBins}</strong> bins</span>`;
        content += `</div>`;
        content += `</div>`;
        content += `</div>`;

        // Test history
        try {
            const historyNodes = queries.getHistoryNodes();
            if (historyNodes.length > 0) {
                const topTests = historyNodes.slice(0, 10);
                content += `<div class="section">`;
                content += `<h2>Recent Test Runs (${historyNodes.length} total)</h2>`;
                content += `<table>`;
                content += `<tr><th>Test Name</th><th>Status</th><th>Timestamp</th></tr>`;
                
                for (const test of topTests) {
                    const statusText = test.test_status === 0 ? '✓ Passed' : `✗ Status ${test.test_status}`;
                    const statusClass = test.test_status === 0 ? 'status-covered' : 'status-uncovered';
                    const date = new Date(test.time_stamp * 1000).toLocaleString();
                    
                    content += `<tr>`;
                    content += `<td>${this.escapeHtml(test.logical_name)}</td>`;
                    content += `<td class="${statusClass}">${statusText}</td>`;
                    content += `<td>${date}</td>`;
                    content += `</tr>`;
                }
                
                content += `</table>`;
                content += `</div>`;
            }
        } catch (error) {
            console.error('Error getting test history:', error);
        }

        return this.getBaseHtml(content);
    }

    /**
     * Calculate coverage distribution buckets
     */
    private calculateDistribution(totalBins: number, overallPercentage: number): any {
        // Simplified distribution
        return {
            total: totalBins,
            percentage: overallPercentage
        };
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
