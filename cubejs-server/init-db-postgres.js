/**
 * 初始化 Postgres 数据库（Neon / Railway / 部署环境）
 *
 * 用法（在你的终端运行）：
 *   SQL_HOST=ep-xxx.us-east-1.aws.neon.tech \
 *   SQL_PORT=5432 \
 *   SQL_DATABASE=neondb \
 *   SQL_USER=neondb_owner \
 *   SQL_PASSWORD=你的密码 \
 *   node init-db-postgres.js
 */
const { Client } = require('pg');
const path = require('path');

// 如果环境变量没设置，尝试从 .env 读取
const dotenvPath = path.join(__dirname, '.env');
try {
  const dotenv = require('dotenv').config({ path: dotenvPath });
  if (dotenv.error && process.env.SQL_HOST) {
    // .env not found but env vars already set
  }
} catch {}

if (!process.env.SQL_HOST) {
  console.error('错误：未设置 SQL_HOST 环境变量');
  console.error('请先设置 SQL_HOST, SQL_DATABASE, SQL_USER, SQL_PASSWORD');
  console.error('或创建 .env 文件（参考 .env.example）');
  process.exit(1);
}

const client = new Client({
  host: process.env.SQL_HOST,
  port: parseInt(process.env.SQL_PORT || '5432'),
  database: process.env.SQL_DATABASE || 'neondb',
  user: process.env.SQL_USER || 'neondb_owner',
  password: process.env.SQL_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('✓ 已连接到 Postgres');

  // ── 建表 ──────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      region TEXT NOT NULL
    )
  `);
  console.log('✓ 表 customers 已就绪');

  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);
  console.log('✓ 表 products 已就绪');

  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_date DATE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      amount REAL NOT NULL,
      quantity INTEGER NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);
  console.log('✓ 表 orders 已就绪');

  // ── 索引 ──────────────────────────────────
  await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_region ON orders(region)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
  console.log('✓ 索引已就绪');

  // ── 检查已有数据 ──────────────────────────
  const existing = await client.query('SELECT COUNT(*)::int as cnt FROM orders');
  if (existing.rows[0].cnt > 0) {
    console.log(`⏭ 已有 ${existing.rows[0].cnt} 条订单数据，跳过初始化`);
    await client.end();
    return;
  }

  // ── 插入 customers ────────────────────────
  const customers = [
    ['张三', '北京', '华北'],
    ['李四', '上海', '华东'],
    ['王五', '广州', '华南'],
    ['赵六', '深圳', '华南'],
    ['孙七', '杭州', '华东'],
    ['周八', '成都', '西南'],
    ['吴九', '武汉', '华中'],
    ['郑十', '西安', '西北'],
    ['钱十一', '南京', '华东'],
    ['冯十二', '重庆', '西南'],
  ];

  for (const c of customers) {
    await client.query(
      'INSERT INTO customers (name, city, region) VALUES ($1, $2, $3)',
      c
    );
  }
  console.log('✓ 已插入 10 个客户');

  // ── 插入 products ─────────────────────────
  const products = [
    ['笔记本电脑', '电子产品', 6999],
    ['智能手机', '电子产品', 3999],
    ['无线耳机', '电子产品', 599],
    ['办公桌椅', '办公家具', 1299],
    ['人体工学椅', '办公家具', 2499],
    ['桌面台灯', '办公家具', 299],
    ['Java编程思想', '图书', 99],
    ['设计模式', '图书', 79],
    ['机器学习导论', '图书', 129],
    ['机械键盘', '数码配件', 399],
  ];

  for (const p of products) {
    await client.query(
      'INSERT INTO products (name, category, price) VALUES ($1, $2, $3)',
      p
    );
  }
  console.log('✓ 已插入 10 个产品');

  // ── 生成订单数据 ──────────────────────────
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(42);
  const statuses = ['completed', 'shipped', 'pending', 'cancelled'];
  const regions = ['华北', '华东', '华南', '华中', '西南', '西北'];

  const allDates = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + 86400000)) {
    allDates.push(d.toISOString().split('T')[0]);
  }

  console.log(`⏳ 正在生成 ${allDates.length} 天的订单数据...`);

  // 使用批量 INSERT（每批 500 条），约 15 次网络往返
  let count = 0;
  const batch = [];
  const insertSql = `INSERT INTO orders (order_date, customer_id, product_id, amount, quantity, region, status) VALUES `;

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];
    const numOrders = Math.floor(rand() * 15) + 5;
    for (let j = 0; j < numOrders; j++) {
      batch.push(
        `('${date}', ${Math.floor(rand() * 10) + 1}, ${Math.floor(rand() * 10) + 1}, ${parseFloat((rand() * 5000 + 100).toFixed(2))}, ${Math.floor(rand() * 5) + 1}, '${regions[Math.floor(rand() * regions.length)]}', '${statuses[Math.floor(rand() * statuses.length)]}')`
      );
      count++;
      if (batch.length >= 500) {
        await client.query(insertSql + batch.join(','));
        batch.length = 0;
      }
    }
    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\r  ${Math.round(((i + 1) / allDates.length) * 100)}% (${count} 条订单)`);
    }
  }
  if (batch.length > 0) {
    await client.query(insertSql + batch.join(','));
  }
  console.log(`\r✓ 已生成 ${count} 条订单`);

  // ── 验证 ──────────────────────────────────
  const stats = await client.query(
    `SELECT COUNT(*)::int as cnt, MIN(order_date) as min_d, MAX(order_date) as max_d FROM orders`
  );
  const s = stats.rows[0];

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   数据库初始化完成！                      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║   客户: 10  产品: 10  订单: ${String(s.cnt).padStart(5)}  ║`);
  console.log(`║   日期范围: ${s.min_d} ~ ${s.max_d}`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log('下一步：启动 Cube.js 服务');
  console.log('  node cube.js');

  await client.end();
}

main().catch((err) => {
  console.error('\n✗ 初始化失败:', err.message);
  client.end();
  process.exit(1);
});