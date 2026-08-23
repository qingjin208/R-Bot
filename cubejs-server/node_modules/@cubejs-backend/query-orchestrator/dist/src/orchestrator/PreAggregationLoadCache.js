"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreAggregationLoadCache = void 0;
const PreAggregations_1 = require("./PreAggregations");
class PreAggregationLoadCache {
    driverFactory;
    queryCache;
    preAggregations;
    queryResults;
    externalDriverFactory;
    requestId;
    versionEntries;
    tables;
    tableColumnTypes;
    // TODO this is in memory cache structure as well however it depends on
    // data source only and load cache is per data source for now.
    // Make it per data source key in case load cache scope is broaden.
    queryStageState;
    dataSource;
    tablePrefixes;
    constructor(clientFactory, queryCache, preAggregations, options = { dataSource: 'default' }) {
        this.dataSource = options.dataSource;
        this.driverFactory = clientFactory;
        this.queryCache = queryCache;
        this.preAggregations = preAggregations;
        this.queryResults = {};
        this.externalDriverFactory = preAggregations.externalDriverFactory;
        this.requestId = options.requestId;
        this.tablePrefixes = options.tablePrefixes;
        this.versionEntries = {};
        this.tables = {};
        this.tableColumnTypes = {};
    }
    async tablesFromCache(preAggregation, forceRenew = false) {
        let tables = forceRenew ? null : await this.queryCache.getCacheDriver().get(this.tablesCachePrefixKey(preAggregation));
        if (!tables) {
            tables = await this.preAggregations.getLoadCacheQueue(this.dataSource).executeInQueue('query', `Fetch tables for ${preAggregation.preAggregationsSchema}`, {
                preAggregation, requestId: this.requestId
            }, 0, { requestId: this.requestId });
        }
        return tables;
    }
    async fetchTables(preAggregation) {
        if (preAggregation.external && !this.externalDriverFactory) {
            throw new Error('externalDriverFactory is not provided. Please use CUBEJS_DEV_MODE=true or provide Cube Store connection env variables for production usage.');
        }
        const newTables = await this.fetchTablesNoCache(preAggregation);
        await this.queryCache.getCacheDriver().set(this.tablesCachePrefixKey(preAggregation), newTables, this.preAggregations.options.preAggregationsSchemaCacheExpire || 60 * 60);
        return newTables;
    }
    async fetchTablesNoCache(preAggregation) {
        const client = preAggregation.external ?
            await this.externalDriverFactory() :
            await this.driverFactory();
        if (this.tablePrefixes && client.getPrefixTablesQuery && this.preAggregations.options.skipExternalCacheAndQueue) {
            return client.getPrefixTablesQuery(preAggregation.preAggregationsSchema, this.tablePrefixes);
        }
        return client.getTablesQuery(preAggregation.preAggregationsSchema);
    }
    tablesCachePrefixKey(preAggregation) {
        return this.queryCache.getKey('SQL_PRE_AGGREGATIONS_TABLES', `${preAggregation.dataSource}${preAggregation.preAggregationsSchema}${preAggregation.external ? '_EXT' : ''}`);
    }
    async getTablesQuery(preAggregation) {
        const redisKey = this.tablesCachePrefixKey(preAggregation);
        if (!this.tables[redisKey]) {
            const tables = this.preAggregations.options.skipExternalCacheAndQueue && preAggregation.external ?
                await this.fetchTablesNoCache(preAggregation) :
                await this.tablesFromCache(preAggregation);
            if (tables === undefined) {
                throw new Error('Pre-aggregation tables are undefined.');
            }
            this.tables[redisKey] = tables;
        }
        return this.tables[redisKey];
    }
    async getTableColumnTypes(preAggregation, tableName) {
        const prefixKey = this.tablesCachePrefixKey(preAggregation);
        if (!this.tableColumnTypes[prefixKey]?.[tableName]) {
            if (!this.preAggregations.options.skipExternalCacheAndQueue && preAggregation.external) {
                throw new Error(`Lambda union with source data feature is supported only by external rollups stored in Cube Store but was invoked for '${preAggregation.preAggregationId}'`);
            }
            const client = await this.externalDriverFactory();
            const columnTypes = await client.tableColumnTypes(tableName);
            if (!this.tableColumnTypes[prefixKey]) {
                this.tableColumnTypes[prefixKey] = {};
            }
            this.tableColumnTypes[prefixKey][tableName] = columnTypes;
        }
        return this.tableColumnTypes[prefixKey][tableName];
    }
    async calculateVersionEntries(preAggregation) {
        let versionEntries = (0, PreAggregations_1.tablesToVersionEntries)(preAggregation.preAggregationsSchema, await this.getTablesQuery(preAggregation));
        // It presumes strong consistency guarantees for external pre-aggregation tables ingestion
        if (!preAggregation.external) {
            const [, , queries] = await this.fetchQueryStageState();
            const targetTableNamesInQueue = (Object.keys(queries))
                .map(q => PreAggregations_1.PreAggregations.targetTableName(queries[q].query.newVersionEntry));
            versionEntries = versionEntries.filter(e => targetTableNamesInQueue.indexOf(PreAggregations_1.PreAggregations.targetTableName(e)) === -1);
        }
        const byContent = {};
        const byStructure = {};
        const byTableName = {};
        versionEntries.forEach(e => {
            const contentKey = `${e.table_name}_${e.content_version}`;
            if (!byContent[contentKey]) {
                byContent[contentKey] = e;
            }
            const structureKey = `${e.table_name}_${e.structure_version}`;
            if (!byStructure[structureKey]) {
                byStructure[structureKey] = e;
            }
            if (!byTableName[e.table_name]) {
                byTableName[e.table_name] = e;
            }
        });
        return { versionEntries, byContent, byStructure, byTableName };
    }
    async getVersionEntries(preAggregation) {
        if (this.tablePrefixes && !this.tablePrefixes.find(p => preAggregation.tableName.split('.')[1].startsWith(p))) {
            throw new Error(`Load cache tries to load table ${preAggregation.tableName} outside of tablePrefixes filter: ${this.tablePrefixes.join(', ')}`);
        }
        const redisKey = this.tablesCachePrefixKey(preAggregation);
        if (!(await this.versionEntries[redisKey])) {
            this.versionEntries[redisKey] = this.calculateVersionEntries(preAggregation).catch(e => {
                delete this.versionEntries[redisKey];
                throw e;
            });
        }
        return this.versionEntries[redisKey];
    }
    async keyQueryResult(sqlQuery, waitForRenew, priority) {
        const [query, values, queryOptions] = Array.isArray(sqlQuery) ? sqlQuery : [sqlQuery, [], {}];
        if (!this.queryResults[this.queryCache.queryRedisKey([query, values])]) {
            this.queryResults[this.queryCache.queryRedisKey([query, values])] = await this.queryCache.cacheQueryResult(query, values, [query, values], 60 * 60, {
                renewalThreshold: this.queryCache.options.refreshKeyRenewalThreshold
                    || queryOptions?.renewalThreshold || 2 * 60,
                renewalKey: [query, values],
                waitForRenew,
                priority,
                requestId: this.requestId,
                dataSource: this.dataSource,
                useInMemory: true,
                external: queryOptions?.external
            });
        }
        return this.queryResults[this.queryCache.queryRedisKey([query, values])];
    }
    hasKeyQueryResult(keyQuery) {
        return !!this.queryResults[this.queryCache.queryRedisKey(keyQuery)];
    }
    async getQueryStage(stageQueryKey) {
        const queue = await this.preAggregations.getQueue(this.dataSource);
        await this.fetchQueryStageState(queue);
        return queue.getQueryStage(stageQueryKey, undefined, this.queryStageState);
    }
    async fetchQueryStageState(queue) {
        queue = queue || await this.preAggregations.getQueue(this.dataSource);
        if (!this.queryStageState) {
            this.queryStageState = await queue.fetchQueryStageState();
        }
        return this.queryStageState;
    }
    async reset(preAggregation) {
        await this.tablesFromCache(preAggregation, true);
        this.tables = {};
        this.tableColumnTypes = {};
        this.queryStageState = undefined;
        this.versionEntries = {};
    }
}
exports.PreAggregationLoadCache = PreAggregationLoadCache;
//# sourceMappingURL=PreAggregationLoadCache.js.map