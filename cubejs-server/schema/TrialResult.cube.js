cube(`TrialResult`, {
  sql: `SELECT * FROM v_trial_efficacy`,

  measures: {
    metricValueAvg: {
      type: `avg`,
      sql: `metric_value`,
      title: `指标均值`,
      description: `指标的算术平均值`,
    },
    metricValueSum: {
      type: `sum`,
      sql: `metric_value`,
      title: `指标总和`,
      description: `指标值总和`,
    },
    metricValueMin: {
      type: `min`,
      sql: `metric_value`,
      title: `指标最小值`,
    },
    metricValueMax: {
      type: `max`,
      sql: `metric_value`,
      title: `指标最大值`,
    },
    stdDev: {
      type: `avg`,
      sql: `std_dev`,
      title: `标准差`,
    },
    pValueAvg: {
      type: `avg`,
      sql: `p_value`,
      title: `P值均值`,
      description: `显著性检验P值`,
    },
    sampleSize: {
      type: `avg`,
      sql: `n`,
      title: `样本量`,
      description: `试验组样本数量`,
    },
    resultCount: {
      type: `count`,
      sql: `metric_value`,
      title: `结果数`,
      description: `试验结果记录数`,
    },
  },

  dimensions: {
    trialCode: {
      sql: `trial_code`,
      type: `string`,
      title: `试验编号`,
      description: `试验唯一编号`,
    },
    productName: {
      sql: `product_name`,
      type: `string`,
      title: `产品名称`,
    },
    siteName: {
      sql: `site_name`,
      type: `string`,
      title: `试验场地`,
    },
    groupType: {
      sql: `group_type`,
      type: `string`,
      title: `组别类型`,
      description: `CONTROL=对照组, TREATMENT=试验组, POSITIVE_CONTROL=阳性对照`,
    },
    doseRate: {
      sql: `dose_rate`,
      type: `number`,
      title: `剂量`,
    },
    metricCode: {
      sql: `metric_code`,
      type: `string`,
      title: `指标编码`,
      description: `ADG=日增重, GF=饲料转化率, HCW=热胴体重, DMI=干物质采食量, MORB=发病率, MORT=死亡率, DRESS=屠宰率, FCR=料肉比, RUMEN_PH=瘤胃pH, ECON=经济效益`,
    },
    metricCategory: {
      sql: `category`,
      type: `string`,
      title: `指标分类`,
    },
    higherIsBetter: {
      sql: `higher_is_better`,
      type: `string`,
      title: `是否越高越好`,
    },
    measurementDate: {
      sql: `measurement_date`,
      type: `string`,
      title: `测量日期`,
    },
  },
});
