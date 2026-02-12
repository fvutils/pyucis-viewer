/**
 * UCIS Database Schema Constants
 * Based on pyucis schema v2.0
 */

// Scope Types
export enum ScopeType {
    INSTANCE = 0,
    COVERGROUP = 1,
    COVERPOINT = 2,
    CROSS = 3,
    TOGGLE = 4,
    BRANCH = 5,
    EXPRESSION = 6,
    FSM = 7,
    ASSERTION = 8
}

// Coverage Item Types
export enum CoverType {
    CVGBIN = 0,
    IGNOREBIN = 1,
    ILLEGALBIN = 2,
    DEFAULTBIN = 3
}

// Table Names
export const Tables = {
    SCOPES: 'scopes',
    COVERITEMS: 'coveritems',
    CROSS_COVERPOINTS: 'cross_coverpoints',
    HISTORY_NODES: 'history_nodes',
    COVERITEM_TESTS: 'coveritem_tests',
    FILES: 'files',
    DESIGN_UNITS: 'design_units',
    TAGS: 'tags',
    OBJECT_TAGS: 'object_tags',
    DB_METADATA: 'db_metadata',
    TOGGLE_BITS: 'toggle_bits',
    FSM_STATES: 'fsm_states',
    FSM_TRANSITIONS: 'fsm_transitions'
};

// Scope interface
export interface Scope {
    scope_id: number;
    parent_id: number | null;
    scope_type: ScopeType;
    scope_name: string;
    weight: number;
    source_id: number | null;
    line: number | null;
    at_least: number;
}

// CoverItem interface
export interface CoverItem {
    cover_id: number;
    scope_id: number;
    cover_type: CoverType;
    cover_name: string;
    cover_index: number;
    cover_data: number;  // hit count
    at_least: number;    // goal
    weight: number;
}

// Database metadata
export interface DbMetadata {
    schema_version: string;
    ucis_version: string;
    created_time: number;
    tool_name?: string;
}

// History node (test run)
export interface HistoryNode {
    history_id: number;
    parent_id: number | null;
    logical_name: string;
    physical_name?: string;
    test_status: number;
    simulation_time: number;
    seed?: string;
    cost: number;
    time_stamp: number;
    command?: string;
}

// File reference
export interface FileRef {
    file_id: number;
    path: string;
}
