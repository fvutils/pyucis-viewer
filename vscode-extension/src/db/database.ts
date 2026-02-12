import * as fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { DbMetadata } from './schema';

/**
 * Manages SQLite database connections using sql.js
 */
export class UcisDatabase {
    private db: Database | null = null;
    private dbPath: string;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    /**
     * Open the database file
     */
    async open(): Promise<void> {
        try {
            // Initialize sql.js
            const SQL = await initSqlJs();
            
            // Read the database file
            const buffer = fs.readFileSync(this.dbPath);
            
            // Create database instance
            this.db = new SQL.Database(buffer);
            
            console.log(`Opened UCIS database: ${this.dbPath}`);
        } catch (error) {
            throw new Error(`Failed to open database ${this.dbPath}: ${error}`);
        }
    }

    /**
     * Close the database
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log(`Closed UCIS database: ${this.dbPath}`);
        }
    }

    /**
     * Check if database is open
     */
    isOpen(): boolean {
        return this.db !== null;
    }

    /**
     * Get the database path
     */
    getPath(): string {
        return this.dbPath;
    }

    /**
     * Execute a SQL query
     */
    exec(sql: string, params?: any[]): any[] {
        if (!this.db) {
            throw new Error('Database not opened');
        }

        try {
            const result = this.db.exec(sql, params);
            return result;
        } catch (error) {
            throw new Error(`Query failed: ${error}\nSQL: ${sql}`);
        }
    }

    /**
     * Execute a query and return first result
     */
    getOne(sql: string, params?: any[]): any | null {
        const results = this.exec(sql, params);
        
        if (results.length === 0 || results[0].values.length === 0) {
            return null;
        }

        const columns = results[0].columns;
        const values = results[0].values[0];
        
        // Convert to object
        const row: any = {};
        columns.forEach((col: string, idx: number) => {
            row[col] = values[idx];
        });
        
        return row;
    }

    /**
     * Execute a query and return all results
     */
    getAll(sql: string, params?: any[]): any[] {
        const results = this.exec(sql, params);
        
        if (results.length === 0) {
            return [];
        }

        const columns = results[0].columns;
        const rows: any[] = [];
        
        for (const values of results[0].values) {
            const row: any = {};
            columns.forEach((col: string, idx: number) => {
                row[col] = values[idx];
            });
            rows.push(row);
        }
        
        return rows;
    }

    /**
     * Get database metadata
     */
    getMetadata(): DbMetadata | null {
        const sql = 'SELECT * FROM db_metadata LIMIT 1';
        return this.getOne(sql);
    }

    /**
     * Verify database has required UCIS tables
     */
    verifySchema(): boolean {
        try {
            const sql = `
                SELECT name FROM sqlite_master 
                WHERE type='table' AND (
                    name='scopes' OR 
                    name='coveritems' OR 
                    name='db_metadata'
                )
            `;
            const tables = this.getAll(sql);
            return tables.length >= 3;
        } catch (error) {
            return false;
        }
    }
}
