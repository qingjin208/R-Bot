// Server-side only — imported by ai-analyze.ts (which lives in an API Route).
// Do NOT import this file from client components.

const CUBEJS_API_URL =
  process.env.CUBEJS_API_URL || 'http://localhost:4000/cubejs-api/v1';

export interface CubeQuery {
  measures: string[];
  dimensions: string[];
  filters?: Array<{ member: string; operator: string; value: unknown }>;
  order?: { measure: string; direction: 'asc' | 'desc' } | string;
  limit?: number;
  chartType?: 'pie' | 'bar' | 'line' | 'table';
}

export interface CubeResponse {
  data: Record<string, unknown>[];
  query: Record<string, unknown>;
  annotation?: Record<string, unknown>;
}

/**
 * POST a Cube.js query to the running Cube.js server.
 * Strips client-only fields (`chartType`) and normalises `order` from
 * `{ measure, direction }` → `"measure direction"` before sending.
 */
export async function cubeLoad(query: CubeQuery): Promise<CubeResponse> {
  const { chartType, order, ...rest } = query;

  const payloadQuery: Record<string, unknown> = { ...rest };

  if (order) {
    // Cube.js v1.4.4 requires order as an object { "MeasureName": "desc" }
    // Convert { measure, direction } or string "MeasureName desc" → { "MeasureName": "desc" }
    const orderObj: Record<string, string> = {};
    if (typeof order === 'object') {
      const measureName = order.measure;
      const dir = order.direction || 'asc';
      if (measureName) orderObj[measureName] = dir;
    } else {
      const parts = order.trim().split(/\s+/);
      if (parts.length >= 1) {
        const dir = parts.length >= 2 ? parts[1] : 'asc';
        orderObj[parts[0]] = dir;
      }
    }
    if (Object.keys(orderObj).length > 0) {
      payloadQuery.order = orderObj;
    }
  }

  const res = await fetch(`${CUBEJS_API_URL}/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: payloadQuery }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Cube.js 查询失败' }));
    throw new Error(err.error || `Cube.js 查询失败 (${res.status})`);
  }

  return res.json();
}
