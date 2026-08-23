import Stream from 'pg-query-stream';
import type { FieldDef } from 'pg';
export declare class QueryStream extends Stream {
    fields(): Promise<FieldDef[]>;
}
//# sourceMappingURL=QueryStream.d.ts.map