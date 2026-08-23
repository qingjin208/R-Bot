"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheHash = exports.processUidRE = void 0;
const crypto_1 = __importDefault(require("crypto"));
const shared_1 = require("@cubejs-backend/shared");
/**
 * Unique process ID regexp.
 */
exports.processUidRE = /^[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}$/;
/**
 * Returns query hash by specified `queryKey`.
 */
function getCacheHash(queryKey, processUid) {
    processUid = processUid || (0, shared_1.getProcessUid)();
    if (typeof queryKey === 'string' && queryKey.length < 256) {
        return queryKey;
    }
    if (typeof queryKey === 'object' && 'persistent' in queryKey && queryKey.persistent) {
        return `${crypto_1.default
            .createHash('md5')
            .update(JSON.stringify(queryKey))
            .digest('hex')}@${processUid}`;
    }
    else {
        return crypto_1.default
            .createHash('md5')
            .update(JSON.stringify(queryKey))
            .digest('hex');
    }
}
exports.getCacheHash = getCacheHash;
//# sourceMappingURL=utils.js.map