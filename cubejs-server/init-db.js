const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data.db');

// 删除旧数据库文件，如果文件被锁定则重试
function deleteDatabase(path, retries) {
  retries = retries || 5;
  if (!fs.existsSync(path)) return true;
  for (let i = 0; i < retries; i++) {
    try {
      fs.unlinkSync(path);
      return true;
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.log(`  文件被锁定，等待释放... (${i + 1}/${retries})`);
        const start = Date.now();
        while (Date.now() - start < 500) {}
      } else {
        throw err;
      }
    }
  }
  return false;
}

if (fs.existsSync(DB_PATH)) {
  if (!deleteDatabase(DB_PATH)) {
    console.error('\n错误：无法删除 data.db，文件仍被其他进程占用。');
    console.error('请确保 Cube.js 服务器已停止（Ctrl+C 终止），然后重新运行 npm run init-db。');
    process.exit(1);
  }
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');

db.exec(`CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT NOT NULL
  )`);

db.exec(`CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL
  )`);

db.exec(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_date TEXT NOT NULL,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    quantity INTEGER NOT NULL,
    region TEXT NOT NULL,
    status TEXT NOT NULL
  )`);

db.exec(`CREATE INDEX idx_orders_region ON orders(region)`);
db.exec(`CREATE INDEX idx_orders_date ON orders(order_date)`);
db.exec(`CREATE INDEX idx_orders_status ON orders(status)`);

const insertCustomer = db.prepare('INSERT INTO customers (name, city, region) VALUES (?, ?, ?)');
const insertProduct = db.prepare('INSERT INTO products (name, category, price) VALUES (?, ?, ?)');
const insertOrder = db.prepare(
  'INSERT INTO orders (order_date, customer_id, product_id, amount, quantity, region, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

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

const insertCustomers = db.transaction((customers) => {
  for (const c of customers) insertCustomer.run(c[0], c[1], c[2]);
});
insertCustomers(customers);

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

const insertProducts = db.transaction((products) => {
  for (const p of products) insertProduct.run(p[0], p[1], p[2]);
});
insertProducts(products);

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

console.log(`Generating orders for ${allDates.length} days...`);

const insertOrders = db.transaction((dates) => {
  let count = 0;
  for (const date of dates) {
    const numOrders = Math.floor(rand() * 15) + 5;
    for (let i = 0; i < numOrders; i++) {
      insertOrder.run(
        date,
        Math.floor(rand() * 10) + 1,
        Math.floor(rand() * 10) + 1,
        parseFloat((rand() * 5000 + 100).toFixed(2)),
        Math.floor(rand() * 5) + 1,
        regions[Math.floor(rand() * regions.length)],
        statuses[Math.floor(rand() * statuses.length)]
      );
      count++;
    }
  }
  return count;
});

const orderCount = insertOrders(allDates);
console.log(`Total orders: ${orderCount}`);

const stats = db.prepare(
  'SELECT COUNT(*) as cnt, MIN(order_date) as min_d, MAX(order_date) as max_d FROM orders'
).get();
console.log(
  `Database initialized: ${customers.length} customers, ` +
    `${products.length} products, ${stats.cnt} orders\n` +
    `Date range: ${stats.min_d} to ${stats.max_d}`
);

db.close();
