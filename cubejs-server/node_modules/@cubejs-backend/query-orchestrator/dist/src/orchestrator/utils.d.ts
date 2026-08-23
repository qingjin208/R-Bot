import { QueryKey, QueryKeyHash } from '@cubejs-backend/base-driver';
import { CacheKey } from './QueryCache';
/**
 * Unique process ID regexp.
 */
export declare const processUidRE: RegExp;
/**
 * Returns query hash by specified `queryKey`.
 */
export declare function getCacheHash(queryKey: QueryKey | CacheKey, processUid?: string): QueryKeyHash;
//# sourceMappingURL=utils.d.ts.map