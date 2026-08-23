cube(`Products`, {
  sql: `SELECT * FROM products`,
  measures: {
    count: {
      sql: `COUNT(*)`,
      type: `count`,
      title: `产品数`,
    },
  },
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    name: {
      sql: `name`,
      type: `string`,
      title: `产品名称`,
    },
    category: {
      sql: `category`,
      type: `string`,
      title: `产品类别`,
    },
  },
});
