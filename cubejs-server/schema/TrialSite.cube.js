cube(`TrialSite`, {
  sql: `SELECT * FROM trial_site`,

  measures: {
    siteCount: {
      type: `count`,
      sql: `site_id`,
      title: `场地数`,
    },
  },

  dimensions: {
    site_id: {
      sql: `site_id`,
      type: `number`,
      title: `场地ID`,
      primaryKey: true,
    },
    site_name: {
      sql: `site_name`,
      type: `string`,
      title: `场地名称`,
    },
    site_kind: {
      sql: `site_kind`,
      type: `string`,
      title: `场地类型`,
    },
  },
});
