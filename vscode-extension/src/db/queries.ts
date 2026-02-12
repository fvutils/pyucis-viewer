import { UcisDatabase } from './database';
import { Scope, CoverItem, HistoryNode, CoverType, Tables } from './schema';

/**
 * Parameterized SQL queries for UCIS database access
 */
export class UcisQueries {
    private db: UcisDatabase;

    constructor(db: UcisDatabase) {
        this.db = db;
    }

    /**
     * Get root scopes (top-level instances)
     */
    getRootScopes(): Scope[] {
        const sql = `
            SELECT * FROM ${Tables.SCOPES} 
            WHERE parent_id IS NULL 
            ORDER BY scope_name
        `;
        return this.db.getAll(sql);
    }

    /**
     * Get children of a scope
     */
    getChildScopes(parentId: number): Scope[] {
        const sql = `
            SELECT * FROM ${Tables.SCOPES} 
            WHERE parent_id = ? 
            ORDER BY scope_name
        `;
        return this.db.getAll(sql, [parentId]);
    }

    /**
     * Get a scope by ID
     */
    getScope(scopeId: number): Scope | null {
        const sql = `SELECT * FROM ${Tables.SCOPES} WHERE scope_id = ?`;
        return this.db.getOne(sql, [scopeId]);
    }

    /**
     * Get coveritems (bins) for a scope
     */
    getCoverItems(scopeId: number): CoverItem[] {
        const sql = `
            SELECT * FROM ${Tables.COVERITEMS} 
            WHERE scope_id = ? 
            ORDER BY cover_index
        `;
        return this.db.getAll(sql, [scopeId]);
    }

    /**
     * Get coverage bins (excluding ignore/illegal bins)
     */
    getCoverageBins(scopeId: number, excludeIgnored: boolean = true, excludeIllegal: boolean = true): CoverItem[] {
        let whereClause = `scope_id = ?`;
        
        if (excludeIgnored) {
            whereClause += ` AND cover_type != ${CoverType.IGNOREBIN}`;
        }
        if (excludeIllegal) {
            whereClause += ` AND cover_type != ${CoverType.ILLEGALBIN}`;
        }

        const sql = `
            SELECT * FROM ${Tables.COVERITEMS} 
            WHERE ${whereClause}
            ORDER BY cover_index
        `;
        return this.db.getAll(sql, [scopeId]);
    }

    /**
     * Calculate coverage for a coverpoint/cross
     * Returns {total: number, covered: number, percentage: number}
     */
    calculateCoverage(scopeId: number, excludeIgnored: boolean = true, excludeIllegal: boolean = true): { total: number; covered: number; percentage: number } {
        const bins = this.getCoverageBins(scopeId, excludeIgnored, excludeIllegal);
        
        if (bins.length === 0) {
            return { total: 0, covered: 0, percentage: 0 };
        }

        const total = bins.length;
        const covered = bins.filter(bin => bin.cover_data >= bin.at_least).length;
        const percentage = (covered / total) * 100;

        return { total, covered, percentage };
    }

    /**
     * Get all uncovered bins in the database
     */
    getUncoveredBins(excludeIgnored: boolean = true, excludeIllegal: boolean = true): Array<CoverItem & { scope_name: string }> {
        let whereClause = `ci.cover_data < ci.at_least`;
        
        if (excludeIgnored) {
            whereClause += ` AND ci.cover_type != ${CoverType.IGNOREBIN}`;
        }
        if (excludeIllegal) {
            whereClause += ` AND ci.cover_type != ${CoverType.ILLEGALBIN}`;
        }

        const sql = `
            SELECT ci.*, s.scope_name 
            FROM ${Tables.COVERITEMS} ci
            JOIN ${Tables.SCOPES} s ON ci.scope_id = s.scope_id
            WHERE ${whereClause}
            ORDER BY s.scope_name, ci.cover_index
        `;
        return this.db.getAll(sql);
    }

    /**
     * Get history nodes (test runs)
     */
    getHistoryNodes(): HistoryNode[] {
        const sql = `
            SELECT * FROM ${Tables.HISTORY_NODES} 
            ORDER BY time_stamp DESC
        `;
        return this.db.getAll(sql);
    }

    /**
     * Get tests that contributed to a specific bin
     */
    getTestsForBin(coverId: number): Array<{ test_name: string; contribution: number; test_status: number }> {
        const sql = `
            SELECT hn.logical_name as test_name, ct.count_contribution as contribution, hn.test_status
            FROM ${Tables.COVERITEM_TESTS} ct
            JOIN ${Tables.HISTORY_NODES} hn ON ct.history_id = hn.history_id
            WHERE ct.cover_id = ?
            ORDER BY ct.count_contribution DESC
        `;
        return this.db.getAll(sql, [coverId]);
    }

    /**
     * Get file reference by ID
     */
    getFile(fileId: number): { file_id: number; path: string } | null {
        const sql = `SELECT * FROM ${Tables.FILES} WHERE file_id = ?`;
        return this.db.getOne(sql, [fileId]);
    }

    /**
     * Count total scopes by type
     */
    getScopeCounts(): { scope_type: number; count: number }[] {
        const sql = `
            SELECT scope_type, COUNT(*) as count 
            FROM ${Tables.SCOPES} 
            GROUP BY scope_type
        `;
        return this.db.getAll(sql);
    }

    /**
     * Count total bins
     */
    getTotalBinCount(excludeIgnored: boolean = true, excludeIllegal: boolean = true): number {
        let whereClause = '1=1';
        
        if (excludeIgnored) {
            whereClause += ` AND cover_type != ${CoverType.IGNOREBIN}`;
        }
        if (excludeIllegal) {
            whereClause += ` AND cover_type != ${CoverType.ILLEGALBIN}`;
        }

        const sql = `SELECT COUNT(*) as count FROM ${Tables.COVERITEMS} WHERE ${whereClause}`;
        const result = this.db.getOne(sql);
        return result ? result.count : 0;
    }
}
