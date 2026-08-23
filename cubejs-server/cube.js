const path = require('path');

process.env.CUBEJS_JWT_SECRET =
  process.env.CUBEJS_JWT_SECRET || 'your-secret-key';
process.env.port = process.env.PORT || '4000';
process.env.CUBEJS_DB_TYPE = 'sqlite';

const { CubejsServer } = require('@cubejs-backend/server');
const SQLiteDriver = require('@cubejs-backend/sqlite-driver');

const server = new CubejsServer({
  driverFactory: async () => {
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
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
