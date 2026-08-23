cube(`Customers`, {
  sql: `SELECT * FROM customers`,
  measures: {
    count: {
      sql: `COUNT(*)`,
      type: `count`,
      title: `客户数`,
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
      title: `客户名称`,
    },
    city: {
      sql: `city`,
      type: `string`,
      title: `城市`,
    },
    region: {
      sql: `region`,
      type: `string`,
      title: `地区`,
    },
  },
});
