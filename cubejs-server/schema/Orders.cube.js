cube(`Orders`, {
  sql: `SELECT * FROM orders`,

  joins: {
    Products: {
      relationship: `belongsTo`,
      sql: `${CUBE}.product_id = ${Products.id}`,
    },
    Customers: {
      relationship: `belongsTo`,
      sql: `${CUBE}.customer_id = ${Customers.id}`,
    },
  },

  measures: {
    orderCount: {
      type: `count`,
      sql: `id`,
      title: `订单数`,
      description: `订单总数量`,
    },
    totalAmount: {
      sql: `amount`,
      type: `sum`,
      title: `销售额`,
      description: `销售额总和`,
    },
    avgAmount: {
      sql: `amount`,
      type: `avg`,
      title: `平均客单价`,
      description: `平均每笔订单金额`,
    },
    totalQuantity: {
      sql: `quantity`,
      type: `sum`,
      title: `总销售数量`,
      description: `商品销售总件数`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      title: `订单ID`,
      primaryKey: true,
    },
    orderDate: {
      sql: `order_date`,
      type: `string`,
      title: `订单日期`,
    },
    orderDateMonth: {
      sql: `strftime('%Y-%m', order_date)`,
      type: `string`,
      title: `订单月份`,
    },
    orderDateQuarter: {
      sql: `strftime('%Y-Q', order_date)`,
      type: `string`,
      title: `订单季度`,
    },
    orderDateYear: {
      sql: `strftime('%Y', order_date)`,
      type: `string`,
      title: `订单年份`,
    },
    region: {
      sql: `region`,
      type: `string`,
      title: `地区`,
      description: `订单所属地区`,
    },
    status: {
      sql: `status`,
      type: `string`,
      title: `订单状态`,
      description: `completed=已完成, shipped=已发货, pending=处理中, cancelled=已取消`,
    },
    customerName: {
      sql: `${Customers.name}`,
      type: `string`,
      title: `客户名称`,
    },
    customerCity: {
      sql: `${Customers.city}`,
      type: `string`,
      title: `客户城市`,
    },
    productName: {
      sql: `${Products.name}`,
      type: `string`,
      title: `产品名称`,
    },
    productCategory: {
      sql: `${Products.category}`,
      type: `string`,
      title: `产品类别`,
    },
  },
});
