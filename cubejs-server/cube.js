const process = require('process');
require('dotenv').config({ path: ['.env.local', '.env'] });

process.env.CUBEJS_JWT_SECRET = process.env.CUBEJS_JWT_SECRET || 'your-secret-key';
process.env.port = process.env.PORT || '4000';
process.env.CUBEJS_DB_TYPE = 'postgres';

const { CubejsServer } = require('@cubejs-backend/server');
const PostgresDriver = require('@cubejs-backend/postgres-driver');

if (!process.env.CUBEJS_POSTGRES_URL) {
  console.error(
    '错误：未设置 CUBEJS_POSTGRES_URL 环境变量。\n' +
      '请设置你的 Neon 连接串（推荐 Pooled 连接串）。\n' +
      '例如：CUBEJS_POSTGRES_URL="postgresql://user:pass@host:5432/neondb?sslmode=require"'
  );
  process.exit(1);
}

const server = new CubejsServer({
  driverFactory: async () => {
    return new PostgresDriver({
      url: process.env.CUBEJS_POSTGRES_URL,
    });
  },
  schemaPath: 'schema',
  apiSecret: process.env.CUBEJS_JWT_SECRET || 'your-secret-key',
});

server.listen().then(() => {
  const port = process.env.port;
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Cube.js 服务已启动                     ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║   地址: http://localhost:${port}             ║`);
  console.log('║   API: POST /cubejs-api/v1/load         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
