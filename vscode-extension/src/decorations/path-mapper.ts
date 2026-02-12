import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Path mapper for resolving database source paths to workspace files
 */
export class PathMapper {
    private mappings: Map<string, string> = new Map();
    private workspaceFolders: readonly vscode.WorkspaceFolder[];

    constructor() {
        this.workspaceFolders = vscode.workspace.workspaceFolders || [];
        this.loadMappings();
    }

    /**
     * Load path mappings from configuration
     */
    private loadMappings(): void {
        const config = vscode.workspace.getConfiguration('pyucis');
        const mappings = config.get<{ [key: string]: string }>('pathMappings', {});
        
        this.mappings.clear();
        for (const [dbPath, wsPath] of Object.entries(mappings)) {
            this.mappings.set(dbPath, wsPath);
        }
    }

    /**
     * Resolve a database path to a workspace file URI
     */
    resolve(dbPath: string): vscode.Uri | null {
        if (!dbPath) {
            return null;
        }

        // Try direct path mappings first
        for (const [dbPrefix, wsPrefix] of this.mappings.entries()) {
            if (dbPath.startsWith(dbPrefix)) {
                const relativePath = dbPath.substring(dbPrefix.length);
                const mappedPath = path.join(wsPrefix, relativePath);
                
                // Try to find in workspace
                const uri = this.findInWorkspace(mappedPath);
                if (uri) {
                    return uri;
                }
            }
        }

        // Try as absolute path
        if (path.isAbsolute(dbPath)) {
            return vscode.Uri.file(dbPath);
        }

        // Try relative to each workspace folder
        for (const folder of this.workspaceFolders) {
            const uri = vscode.Uri.joinPath(folder.uri, dbPath);
            return uri; // Optimistically return
        }

        return null;
    }

    /**
     * Find file in workspace folders
     */
    private findInWorkspace(filePath: string): vscode.Uri | null {
        for (const folder of this.workspaceFolders) {
            const uri = path.isAbsolute(filePath)
                ? vscode.Uri.file(filePath)
                : vscode.Uri.joinPath(folder.uri, filePath);
            
            return uri; // Optimistically return
        }
        return null;
    }

    /**
     * Reload mappings from configuration
     */
    reload(): void {
        this.loadMappings();
    }
}
