cube(`PublicEvidence`, {
  sql: `SELECT * FROM v_public_evidence`,

  measures: {
    liftPctAvg: {
      type: `avg`,
      sql: `lift_pct`,
      title: `平均提升率(%)`,
      description: `试验组相比对照组的平均提升百分比`,
    },
    controlValueAvg: {
      type: `avg`,
      sql: `control_value`,
      title: `对照组均值`,
    },
    treatmentValueAvg: {
      type: `avg`,
      sql: `treatment_value`,
      title: `试验组均值`,
    },
    evidenceCount: {
      type: `count`,
      sql: `evidence_type`,
      title: `证据数量`,
    },
  },

  dimensions: {
    evidenceType: {
      sql: `evidence_type`,
      type: `string`,
      title: `证据类型`,
      description: `trial=试验数据, publication=文献发表`,
    },
    productName: {
      sql: `product_name`,
      type: `string`,
      title: `产品名称`,
    },
    metricCode: {
      sql: `metric_code`,
      type: `string`,
      title: `指标编码`,
    },
    unit: {
      sql: `unit`,
      type: `string`,
      title: `单位`,
    },
    siteKind: {
      sql: `site_kind`,
      type: `string`,
      title: `场地类型`,
    },
    title: {
      sql: `title`,
      type: `string`,
      title: `文献标题`,
    },
    journal: {
      sql: `journal`,
      type: `string`,
      title: `期刊`,
    },
    doi: {
      sql: `doi`,
      type: `string`,
      title: `DOI`,
    },
  },
});
