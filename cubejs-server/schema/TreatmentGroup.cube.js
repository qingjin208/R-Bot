cube(`TreatmentGroup`, {
  sql: `SELECT * FROM treatment_group`,

  measures: {
    groupCount: {
      type: `count`,
      sql: `group_id`,
      title: `组别数`,
      description: `处理组总数`,
    },
    animalCount: {
      type: `sum`,
      sql: `animal_count`,
      title: `动物总数`,
      description: `各组动物数量之和`,
    },
    doseRateAvg: {
      type: `avg`,
      sql: `dose_rate`,
      title: `平均剂量`,
    },
  },

  dimensions: {
    groupId: {
      sql: `group_id`,
      type: `number`,
      title: `组别ID`,
      primaryKey: true,
    },
    trialId: {
      sql: `trial_id`,
      type: `number`,
      title: `所属试验ID`,
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
    doseUnit: {
      sql: `dose_unit`,
      type: `string`,
      title: `剂量单位`,
    },
    adminRoute: {
      sql: `admin_route`,
      type: `string`,
      title: `给药途径`,
    },
    frequency: {
      sql: `frequency`,
      type: `string`,
      title: `给药频率`,
    },
    durationDays: {
      sql: `duration_days`,
      type: `number`,
      title: `试验天数`,
    },
    cattleCategory: {
      sql: `cattle_category`,
      type: `string`,
      title: `牛类别`,
    },
    breed: {
      sql: `breed`,
      type: `string`,
      title: `品种`,
    },
  },
});
