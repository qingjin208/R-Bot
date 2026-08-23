const path = require('path');

process.env.CUBEJS_JWT_SECRET =
  process.env.CUBEJS_JWT_SECRET || 'your-secret-key';
process.env.port = process.env.PORT || '4000';

// 判断是否有 Postgres 连接参数（部署环境）
const hasPg = !!process.env.SQL_HOST;

if (hasPg) {
  process.env.CUBEJS_DB_TYPE = 'postgres';
} else {
  process.env.CUBEJS_DB_TYPE = 'sqlite';
}

const { CubejsServer } = require('@cubejs-backend/server');

const server = new CubejsServer({
  driverFactory: async () => {
    if (hasPg) {
      const { PostgresDriver } = require('@cubejs-backend/postgres-driver');
      return new PostgresDriver({
        host: process.env.SQL_HOST,
        port: parseInt(process.env.SQL_PORT || '5432'),
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        ssl: { rejectUnauthorized: false },
      });
    }

    const SQLiteDriver = require('@cubejs-backend/sqlite-driver');
    return new SQLiteDriver({
      database: path.join(__dirname, 'data.db'),
    });
  },
  schemaPath: 'schema',
});

server.listen().then(() => {
  const port = process.env.port;
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Cube.js 服务已启动                     ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║   地址: http://localhost:${port}             ║`);
  console.log('║   API: POST /cubejs-api/v1/load         ║');
  console.log(`║   DB:   ${hasPg ? 'Postgres (Neon)' : 'SQLite (本地)'}                 ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
