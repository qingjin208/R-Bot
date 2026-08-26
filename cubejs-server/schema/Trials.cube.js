cube(`Trials`, {
  sql: `SELECT * FROM trial`,

  joins: {
    Products: {
      relationship: `belongsTo`,
      sql: `${CUBE}.product_id = ${Products.id}`,
    },
    TrialSite: {
      relationship: `belongsTo`,
      sql: `${CUBE}.site_id = ${TrialSite.site_id}`,
    },
  },

  measures: {
    trialCount: {
      type: `count`,
      sql: `trial_id`,
      title: `试验数`,
      description: `试验总数`,
    },
  },

  dimensions: {
    trialId: {
      sql: `trial_id`,
      type: `number`,
      title: `试验ID`,
      primaryKey: true,
    },
    trialCode: {
      sql: `trial_code`,
      type: `string`,
      title: `试验编号`,
      description: `试验唯一编号，如 PROT-2024-001`,
    },
    productName: {
      sql: `${Products.product_name}`,
      type: `string`,
      title: `产品名称`,
    },
    siteName: {
      sql: `${TrialSite.site_name}`,
      type: `string`,
      title: `试验场地`,
    },
    siteKind: {
      sql: `${TrialSite.site_kind}`,
      type: `string`,
      title: `场地类型`,
      description: `company=公司内部, customer_farm=客户农场, university=高校`,
    },
    status: {
      sql: `status`,
      type: `string`,
      title: `试验状态`,
      description: `completed=已完成, active=进行中, planned=计划中`,
    },
    dataClassification: {
      sql: `data_classification`,
      type: `string`,
      title: `数据分级`,
      description: `public=公开, internal=内部, customer_confidential=客户机密`,
    },
    designType: {
      sql: `design_type`,
      type: `string`,
      title: `试验设计类型`,
    },
    controlType: {
      sql: `control_type`,
      type: `string`,
      title: `对照类型`,
    },
    randomized: {
      sql: `randomized`,
      type: `string`,
      title: `是否随机化`,
    },
    blinding: {
      sql: `blinding`,
      type: `string`,
      title: `盲法类型`,
    },
    sponsor: {
      sql: `sponsor`,
      type: `string`,
      title: `资助方`,
    },
    startDate: {
      sql: `start_date`,
      type: `string`,
      title: `开始日期`,
    },
    endDate: {
      sql: `end_date`,
      type: `string`,
      title: `结束日期`,
    },
  },
});
