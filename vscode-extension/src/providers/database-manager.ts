import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { UcisDatabase } from '../db/database';
import { UcisQueries } from '../db/queries';

/**
 * Manages open database connections
 */
export class DatabaseManager {
    private openDatabases = new Map<string, UcisDatabase>();
    private activeDatabase: string | null = null;
    private queries = new Map<string, UcisQueries>();
    
    private _onActiveDatabaseChanged = new vscode.EventEmitter<string | null>();
    public readonly onActiveDatabaseChanged = this._onActiveDatabaseChanged.event;

    /**
     * Open a database file
     */
    async openDatabase(dbPath: string): Promise<boolean> {
        try {
            // Check if already open
            if (this.openDatabases.has(dbPath)) {
                console.log('Database already open:', dbPath);
                this.setActiveDatabase(dbPath);
                return true;
            }

            // Verify file exists
            if (!fs.existsSync(dbPath)) {
                vscode.window.showErrorMessage(`Database file not found: ${dbPath}`);
                return false;
            }

            // Create and open database
            const db = new UcisDatabase(dbPath);
            await db.open();

            // Verify schema
            if (!db.verifySchema()) {
                db.close();
                vscode.window.showErrorMessage(`Invalid UCIS database schema: ${path.basename(dbPath)}`);
                return false;
            }

            // Store database and queries
            this.openDatabases.set(dbPath, db);
            this.queries.set(dbPath, new UcisQueries(db));

            // Set as active
            this.setActiveDatabase(dbPath);

            // Get metadata for display
            const metadata = db.getMetadata();
            const displayName = path.basename(dbPath);
            
            vscode.window.showInformationMessage(
                `Opened database: ${displayName}` + 
                (metadata ? ` (UCIS ${metadata.ucis_version})` : '')
            );

            console.log('Successfully opened database:', dbPath);
            return true;

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open database: ${error}`);
            console.error('Error opening database:', error);
            return false;
        }
    }

    /**
     * Close a database
     */
    closeDatabase(dbPath: string): void {
        const db = this.openDatabases.get(dbPath);
        if (db) {
            db.close();
            this.openDatabases.delete(dbPath);
            this.queries.delete(dbPath);

            if (this.activeDatabase === dbPath) {
                // Set active to another open database, or null
                const remaining = Array.from(this.openDatabases.keys());
                this.setActiveDatabase(remaining.length > 0 ? remaining[0] : null);
            }

            console.log('Closed database:', dbPath);
        }
    }

    /**
     * Close all databases
     */
    closeAll(): void {
        for (const dbPath of this.openDatabases.keys()) {
            this.closeDatabase(dbPath);
        }
    }

    /**
     * Get database instance
     */
    getDatabase(dbPath: string): UcisDatabase | undefined {
        return this.openDatabases.get(dbPath);
    }

    /**
     * Get queries instance for a database
     */
    getQueries(dbPath: string): UcisQueries | undefined {
        return this.queries.get(dbPath);
    }

    /**
     * Get active database
     */
    getActiveDatabase(): UcisDatabase | null {
        if (this.activeDatabase) {
            return this.openDatabases.get(this.activeDatabase) || null;
        }
        return null;
    }

    /**
     * Get active database path
     */
    getActiveDatabasePath(): string | null {
        return this.activeDatabase;
    }

    /**
     * Get queries for active database
     */
    getActiveQueries(): UcisQueries | null {
        if (this.activeDatabase) {
            return this.queries.get(this.activeDatabase) || null;
        }
        return null;
    }

    /**
     * Set active database
     */
    setActiveDatabase(dbPath: string | null): void {
        if (this.activeDatabase !== dbPath) {
            this.activeDatabase = dbPath;
            this._onActiveDatabaseChanged.fire(dbPath);
            console.log('Active database changed:', dbPath);
        }
    }

    /**
     * Get all open database paths
     */
    getOpenDatabases(): string[] {
        return Array.from(this.openDatabases.keys());
    }

    /**
     * Check if database is open
     */
    isOpen(dbPath: string): boolean {
        return this.openDatabases.has(dbPath);
    }

    /**
     * Refresh a database (reload from disk)
     */
    async refreshDatabase(dbPath: string): Promise<boolean> {
        const wasActive = this.activeDatabase === dbPath;
        
        // Close and reopen
        this.closeDatabase(dbPath);
        const success = await this.openDatabase(dbPath);
        
        if (success && wasActive) {
            this.setActiveDatabase(dbPath);
        }
        
        return success;
    }
}
