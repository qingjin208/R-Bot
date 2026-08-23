import { DriverFactory } from './DriverFactory';
import { QueryCache } from './QueryCache';
import { LambdaQuery, LoadPreAggregationResult, PreAggregationDescription, PreAggregations, PreAggregationTableToTempTable, QueryDateRange } from './PreAggregations';
import { PreAggregationLoadCache } from './PreAggregationLoadCache';
interface PreAggsPartitionRangeLoaderOpts {
    maxPartitions: number;
    maxSourceRowLimit: number;
    waitForRenew?: boolean;
    requestId?: string;
    externalRefresh?: boolean;
    forceBuild?: boolean;
    metadata?: any;
    orphanedTimeout?: number;
    lambdaQuery?: LambdaQuery;
    isJob?: boolean;
    compilerCacheFn?: <T>(subKey: string[], cacheFn: () => T) => T;
}
export declare class PreAggregationPartitionRangeLoader {
    private readonly driverFactory;
    private readonly logger;
    private readonly queryCache;
    private readonly preAggregations;
    private readonly preAggregation;
    private readonly preAggregationsTablesToTempTables;
    private readonly loadCache;
    private readonly options;
    /**
     * Determines whether current instance instantiated for a jobbed build query
     * (initialized by the /cubejs-system/v1/pre-aggregations/jobs endpoint) or
     * not.
     */
    protected isJob: boolean;
    protected waitForRenew: boolean;
    protected requestId: string;
    protected lambdaQuery: LambdaQuery;
    protected dataSource: string;
    protected compilerCacheFn: <T>(subKey: string[], cacheFn: () => T) => T;
    constructor(driverFactory: DriverFactory, logger: any, queryCache: QueryCache, preAggregations: PreAggregations, preAggregation: PreAggregationDescription, preAggregationsTablesToTempTables: PreAggregationTableToTempTable[], loadCache: PreAggregationLoadCache, options?: PreAggsPartitionRangeLoaderOpts);
    private loadRangeQuery;
    protected getInvalidationKeyValues(range: any): Promise<any[]>;
    protected priority(defaultValue: any): any;
    replaceQueryBuildRangeParams(queryValues: string[]): Promise<string[] | null>;
    private replacePartitionSqlAndParams;
    private partitionPreAggregationDescription;
    loadPreAggregations(): Promise<LoadPreAggregationResult>;
    /**
     * Downloads the lambda table from the source DB.
     */
    private downloadLambdaTable;
    partitionPreAggregations(): Promise<PreAggregationDescription[]>;
    private partitionRanges;
    loadBuildRange(timestampFormat?: string): Promise<QueryDateRange>;
    private now;
    private orNowIfEmpty;
    private static checkDataRangeType;
    static intersectDateRanges(rangeA: QueryDateRange | null, rangeB: QueryDateRange | null): QueryDateRange | null;
    static timeSeries(granularity: string, dateRange: QueryDateRange | null, timestampPrecision: number): QueryDateRange[];
    static partitionTableName(tableName: string, partitionGranularity: string, dateRange: QueryDateRange): string;
    static inDbTimeZone(preAggregationDescription: any, timestamp: string): string;
    static extractDate(data: any, timezone: string, timestampFormat?: string): string;
    static readonly FROM_PARTITION_RANGE = "__FROM_PARTITION_RANGE";
    static readonly TO_PARTITION_RANGE = "__TO_PARTITION_RANGE";
}
export {};
//# sourceMappingURL=PreAggregationPartitionRangeLoader.d.ts.map