cube(`Products`, {
  sql: `SELECT * FROM product WHERE deleted_at IS NULL`,

  measures: {
    productCount: {
      type: `count`,
      sql: `product_id`,
      title: `产品数`,
    },
  },

  dimensions: {
    id: {
      sql: `product_id`,
      type: `number`,
      title: `产品ID`,
      primaryKey: true,
    },
    product_name: {
      sql: `product_name`,
      type: `string`,
      title: `产品名称`,
    },
    category: {
      sql: `category`,
      type: `string`,
      title: `产品类别`,
    },
    activeStrain: {
      sql: `active_strain`,
      type: `string`,
      title: `活性菌株`,
    },
    targetSpecies: {
      sql: `target_species`,
      type: `string`,
      title: `目标物种`,
    },
  },
});
