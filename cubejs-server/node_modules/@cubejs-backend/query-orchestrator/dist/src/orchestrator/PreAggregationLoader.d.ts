import { DownloadTableData, DriverCapabilities, DriverInterface, SaveCancelFn, StreamOptions, UnloadOptions } from '@cubejs-backend/base-driver';
import { DriverFactory } from './DriverFactory';
import { QueryCache, QueryWithParams } from './QueryCache';
import { InvalidationKeys, LoadPreAggregationResult, PreAggregations, PreAggregationTableToTempTable, VersionEntry } from './PreAggregations';
import { PreAggregationLoadCache } from './PreAggregationLoadCache';
type IndexesSql = {
    sql: [string, unknown[]];
    indexName: string;
}[];
type QueryKey = [QueryWithParams, IndexesSql, InvalidationKeys] | [QueryWithParams, InvalidationKeys];
type QueryOptions = {
    queryKey: QueryKey;
    newVersionEntry: VersionEntry;
    query: string;
    values: unknown[];
    requestId: string;
    buildRangeEnd?: string;
};
export declare class PreAggregationLoader {
    private readonly driverFactory;
    private readonly logger;
    private readonly queryCache;
    private readonly loadCache;
    private preAggregations;
    preAggregation: any;
    private readonly preAggregationsTablesToTempTables;
    /**
     * Determines whether current instance instantiated for a jobbed build query
     * (initialized by the /cubejs-system/v1/pre-aggregations/jobs endpoint) or
     * not.
     */
    private readonly isJob;
    private readonly waitForRenew;
    private readonly forceBuild;
    private readonly orphanedTimeout;
    private readonly externalDriverFactory;
    private readonly requestId;
    private readonly metadata;
    private readonly structureVersionPersistTime;
    private readonly externalRefresh;
    constructor(driverFactory: DriverFactory, logger: any, queryCache: QueryCache, preAggregations: PreAggregations, preAggregation: any, preAggregationsTablesToTempTables: PreAggregationTableToTempTable[], loadCache: PreAggregationLoadCache, options?: any);
    loadPreAggregation(throwOnMissingPartition: boolean): Promise<null | LoadPreAggregationResult>;
    protected loadPreAggregationWithKeys(): Promise<LoadPreAggregationResult>;
    private updateLastTouch;
    protected contentVersion(invalidationKeys: InvalidationKeys): string;
    protected priority(defaultValue: number): number;
    protected getInvalidationKeyValues(): Promise<any[]>;
    protected getPartitionInvalidationKeyValues(): Promise<any[]>;
    protected scheduleRefresh(invalidationKeys: InvalidationKeys, newVersionEntry: VersionEntry): void;
    protected executeInQueue(invalidationKeys: InvalidationKeys, priority: number, newVersionEntry: VersionEntry): Promise<any>;
    protected preAggregationQueryKey(invalidationKeys: InvalidationKeys): QueryKey;
    protected targetTableName(versionEntry: VersionEntry): string;
    refresh(newVersionEntry: VersionEntry, invalidationKeys: InvalidationKeys, client: any): any;
    protected logExecutingSql(payload: any): void;
    protected queryOptions(invalidationKeys: InvalidationKeys, query: string, params: unknown[], targetTableName: string, newVersionEntry: VersionEntry): {
        queryKey: QueryKey;
        query: string;
        values: unknown[];
        targetTableName: string;
        requestId: string;
        newVersionEntry: VersionEntry;
        buildRangeEnd: any;
    };
    protected refreshStoreInSourceStrategy(client: DriverInterface, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, invalidationKeys: InvalidationKeys): Promise<void>;
    protected refreshWriteStrategy(client: DriverInterface, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, invalidationKeys: InvalidationKeys): Promise<void>;
    /**
     * Runs export strategy with write access in data source
     */
    protected runWriteStrategy(client: DriverInterface, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, invalidationKeys: InvalidationKeys, withTempTable: boolean, dropSourceTempTable: boolean): Promise<void>;
    /**
     * Cleanup tables after write strategy
     */
    protected cleanupWriteStrategy(client: DriverInterface, targetTableName: string, queryOptions: QueryOptions, saveCancelFn: SaveCancelFn, withTempTable: boolean, dropSourceTempTable: boolean): Promise<void>;
    /**
     * Create table (if required) and prepares query options object
     */
    protected prepareWriteStrategy(client: DriverInterface, targetTableName: string, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, invalidationKeys: InvalidationKeys, withTempTable: boolean): Promise<QueryOptions>;
    /**
     * Strategy to copy pre-aggregation from source db (for read-only permissions) to external data
     */
    protected refreshReadOnlyExternalStrategy(client: DriverInterface, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, invalidationKeys: InvalidationKeys): Promise<void>;
    protected getUnloadOptions(): UnloadOptions;
    protected getStreamingOptions(): StreamOptions;
    /**
     * prepares download data for future cube store usage
     */
    protected downloadExternalPreAggregation(client: DriverInterface, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, queryOptions: QueryOptions, withTempTable: boolean): Promise<import("@cubejs-backend/base-driver").TableMemoryData | import("@cubejs-backend/base-driver").TableCSVData | import("@cubejs-backend/base-driver").StreamTableData>;
    /**
     * prepares download data when temp table = true
     */
    protected getTableDataWithTempTable(client: DriverInterface, table: string, saveCancelFn: SaveCancelFn, queryOptions: QueryOptions, externalDriverCapabilities: DriverCapabilities): Promise<import("@cubejs-backend/base-driver").TableMemoryData | import("@cubejs-backend/base-driver").TableCSVData | import("@cubejs-backend/base-driver").StreamTableData>;
    /**
     * prepares download data when temp table = false
     */
    protected getTableDataWithoutTempTable(client: DriverInterface, table: string, saveCancelFn: SaveCancelFn, queryOptions: QueryOptions, externalDriverCapabilities: DriverCapabilities): Promise<import("@cubejs-backend/base-driver").TableMemoryData | import("@cubejs-backend/base-driver").TableCSVData | import("@cubejs-backend/base-driver").StreamTableData>;
    protected uploadExternalPreAggregation(tableData: DownloadTableData, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, queryOptions: QueryOptions): Promise<void>;
    protected createIndexes(driver: DriverInterface, newVersionEntry: VersionEntry, saveCancelFn: SaveCancelFn, queryOptions: QueryOptions): Promise<void>;
    protected prepareIndexesSql(newVersionEntry: VersionEntry, queryOptions: QueryOptions): any;
    protected prepareCreateTableIndexes(newVersionEntry: VersionEntry): any;
    private withDropLock;
    protected dropOrphanedTables(client: DriverInterface, justCreatedTable: string, saveCancelFn: SaveCancelFn, external: boolean, queryOptions: QueryOptions): Promise<boolean>;
    private dropOrphanedLockKey;
}
export {};
//# sourceMappingURL=PreAggregationLoader.d.ts.map