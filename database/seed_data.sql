-- ============================================================================
-- 益生菌(DFM)肉牛试验数据平台 —— 示例数据(seed)
-- ----------------------------------------------------------------------------
-- 配套：pgsql_schema.sql（表结构须先执行）
-- 目标：向 18 张表灌入“比较真实且偏多”的示例数据，便于演示 Chatbot / Cube 查询。
--
-- 数据策略：
--   ① 维度表(region/sales_rep/customer/contact/product/product_batch/
--      trial_site/trial/metric_definition/publication/product_publication/report)
--      采用“手工策划”的写实数据（真实地名、牛场名、期刊名、指标）。
--   ② 事实表(trial_batch/treatment_group/trial_result/animal/weigh_event/
--      report_item)用 DO 块 + generate_series/random 批量生成，保证“多一些”。
--
-- 实现说明：
--   • cfu_potency 单位取「十亿 CFU/g」(×10^9)，以适配 NUMERIC(12,2)；
--     如 42.50 表示 4.25×10^10 CFU/g（真实益生菌效价区间）。
--   • 处理组效应按指标 higher_is_better 决定方向：获益指标试验组 = 基线×(1+提升)，
--     劣向指标(发病率/料肉比等)试验组 = 基线×(1−幅度)；并叠加 ±2.5% 噪声。
--   • 主键：维度表用显式小整数(<1000)；事实表用序列 seed_seq(从1000起)生成，
--     避免与维度表 ID 冲突。运行结束会 DROP 该序列。
--   • 严格按外键/触发器依赖顺序插入，满足所有 CHECK 与跨表一致性触发器。
--
-- 预计体量：约 10 试验 / 23 处理组 / 230 试验结果 / 460 牛只 / 1380 称重 /
--           20 亚批次 / 45 报告条目 —— 足以演示“益生菌 vs 对照”的分级与对比。
--
-- 重跑：如需清空重灌，先执行（谨慎）
--   TRUNCATE region, sales_rep, customer, contact, product, product_batch,
--     trial_site, trial, trial_batch, treatment_group, metric_definition,
--     trial_result, publication, product_publication, report, report_item,
--     animal, weigh_event RESTART IDENTITY CASCADE;
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS seed_seq START WITH 1000;


-- ===================== A. 区域 / 人员 / 农场（策划写实）=====================

INSERT INTO region (region_id, region_code, region_name) VALUES
(1,'SW','South West'),
(2,'MW','Midwest'),
(3,'SE','South East'),
(4,'NW','North West');

INSERT INTO sales_rep (rep_id, region_id, rep_name, email) VALUES
(1,1,'John Carter','john.carter@xyzagri.com'),
(2,1,'Maria Gonzalez','maria.g@xyzagri.com'),
(3,2,'Mike Thompson','mike.t@xyzagri.com'),
(4,2,'Sarah Lin','sarah.lin@xyzagri.com'),
(5,3,'David Brown','david.b@xyzagri.com'),
(6,3,'Emily Davis','emily.d@xyzagri.com'),
(7,4,'Chris Wilson','chris.w@xyzagri.com'),
(8,4,'Ashley Moore','ashley.m@xyzagri.com');

INSERT INTO customer (customer_id, region_id, customer_name, customer_type, city, state) VALUES
(1,1,'Bar T Cattle Co','feedlot','Hereford','TX'),
(2,1,'Lone Star Feeders','feedlot','Amarillo','TX'),
(3,1,'Sunbelt Dairy','dairy','Tucson','AZ'),
(4,2,'Corn Belt Feeders','feedlot','Omaha','NE'),
(5,2,'Prairie View Ranch','ranch','Sioux Falls','SD'),
(6,2,'Midwest Dairy Group','dairy','Green Bay','WI'),
(7,3,'Peachtree Livestock','feedlot','Albany','GA'),
(8,3,'Gulf Coast Cattle','ranch','Tampa','FL'),
(9,3,'Southern Dairy Farms','dairy','Montgomery','AL'),
(10,4,'Cascade Beef','feedlot','Kennewick','WA'),
(11,4,'High Desert Ranch','ranch','Boise','ID'),
(12,4,'Pacific Northwest Dairy','dairy','Eugene','OR');

INSERT INTO contact (contact_id, customer_id, contact_name, role, credential) VALUES
(1,1,'Robert Bar','Feedlot Manager','DVM'),
(2,1,'Linda Hayes','Owner',''),
(3,2,'James Ford','General Manager',''),
(4,3,'Carlos Ruiz','Herd Nutritionist','MS'),
(5,4,'Tom Becker','Feedlot Manager',''),
(6,5,'Nancy Clark','Ranch Foreman',''),
(7,6,'Kevin Schmidt','Dairy Herd Manager','DVM'),
(8,7,'Walter Pierce','Operations Director',''),
(9,8,'Ana Martinez','Ranch Manager',''),
(10,9,'Betty Lou','Dairy Nutritionist','PhD'),
(11,10,'Greg Hall','Feedlot Supervisor',''),
(12,11,'Roy Bennett','Ranch Owner',''),
(13,12,'Susan Park','Herd Manager','DVM'),
(14,4,'Helen Meyer','Veterinarian','DVM'),
(15,2,'Paul Rogers','Nutrition Consultant','MS'),
(16,7,'Diane Shaw','Quality Control','');


-- ===================== B. 产品 / 批号 / 场地 / 试验（策划写实）=====================

INSERT INTO product (product_id, product_name, category, active_strain, target_species) VALUES
(1,'XYZ Probiotic DFM','DFM probiotic','Lactobacillus acidophilus + Enterococcus faecium','肉牛'),
(2,'XYZ Rumen Buffer','Rumen modifier','Sodium bicarbonate blend','肉牛'),
(3,'ABC Yeast Culture','Live yeast','Saccharomyces cerevisiae','奶牛');

-- cfu_potency 单位：十亿 CFU/g (×10^9)
INSERT INTO product_batch (batch_id, product_id, batch_no, manufacture_date, expiry_date, cfu_potency, qc_status) VALUES
(1,1,'XYZ-PB-2401','2024-01-10','2025-01-10',42.50,'合格'),
(2,1,'XYZ-PB-2402','2024-03-12','2025-03-12',38.20,'合格'),
(3,1,'XYZ-PB-2403','2024-06-05','2025-06-05',45.10,'合格'),
(4,1,'XYZ-PB-2404','2024-09-20','2025-09-20',36.80,'待检'),
(5,2,'XYZ-RB-2401','2024-02-01','2026-02-01',99.00,'合格'),
(6,2,'XYZ-RB-2402','2024-05-15','2026-05-15',98.50,'合格'),
(7,3,'ABC-YC-2401','2024-01-20','2025-01-20',12.30,'合格'),
(8,3,'ABC-YC-2402','2024-04-18','2025-04-18',11.80,'合格'),
(9,3,'ABC-YC-2403','2024-07-22','2025-07-22',13.10,'待检');

INSERT INTO trial_site (site_id, site_name, site_kind, customer_id, city, state, capacity_head) VALUES
(1,'XYZ Research Station','company',NULL,'Hereford','TX',1200),
(2,'Lone Star Feeders Yard','customer_farm',2,'Amarillo','TX',8000),
(3,'Bar T Feedlot','customer_farm',1,'Hereford','TX',5000),
(4,'Midwest Dairy Research','university',NULL,'Madison','WI',600),
(5,'Corn Belt Feeders','customer_farm',4,'Omaha','NE',10000),
(6,'Peachtree Livestock','customer_farm',7,'Albany','GA',6500),
(7,'Pacific NW Dairy','customer_farm',12,'Eugene','OR',900),
(8,'XYZ West Lab','company',NULL,'Boise','ID',400);

INSERT INTO trial (trial_id, trial_code, product_id, site_id, batch_id, start_date, end_date,
                   design_type, control_type, randomized, blinding, sponsor, status,
                   data_classification, protocol_ref) VALUES
(1,'PROT-2024-001',1,1,1,'2024-02-01','2024-05-15','RCT','阴性',true,'双盲','内部','completed','internal','PROT-2024-001'),
(2,'PROT-2024-002',1,3,2,'2024-03-01','2024-06-10','Block','阴性',true,'单盲','客户专属','completed','customer_confidential','PROT-2024-002'),
(3,'PROT-2024-003',1,2,3,'2024-06-15','2024-09-30','Paired','阴性',false,'开放','内部','completed','internal','PROT-2024-003'),
(4,'PROT-2024-004',1,5,4,'2024-09-01','2024-12-15','RCT','阳性',true,'双盲','内部','active','internal','PROT-2024-004'),
(5,'PROT-2024-005',2,1,5,'2024-02-10','2024-05-20','RCT','阴性',true,'双盲','公开','completed','public','PROT-2024-005'),
(6,'PROT-2024-006',2,4,6,'2024-04-01','2024-07-15','Block','阴性',true,'单盲','公开','completed','public','PROT-2024-006'),
(7,'PROT-2024-007',3,6,7,'2024-03-05','2024-06-20','RCT','阴性',true,'双盲','客户专属','completed','customer_confidential','PROT-2024-007'),
(8,'PROT-2024-008',3,8,8,'2024-05-01','2024-08-15','Paired','阴性',false,'开放','内部','completed','internal','PROT-2024-008'),
(9,'PROT-2024-009',3,7,9,'2024-06-01','2024-09-10','RCT','阴性',true,'双盲','公开','active','public','PROT-2024-009'),
(10,'PROT-2024-010',1,1,3,'2024-07-01','2024-10-20','RCT','阳性',true,'双盲','公开','planned','public','PROT-2024-010');


-- ===================== C. 指标字典（策划写实）=====================

INSERT INTO metric_definition (metric_id, metric_code, category, unit, description, higher_is_better) VALUES
(1,'ADG','growth','kg/day','平均日增重',true),
(2,'GF','growth','kg/kg','增重耗料比(增益/饲料)',true),
(3,'HCW','carcass','kg','热胴体重',true),
(4,'DMI','growth','kg/day','干物质采食量',false),
(5,'MORB','health','%','发病率',false),
(6,'MORT','health','%','死亡率',false),
(7,'DRESS','carcass','%','屠宰率',true),
(8,'FCR','growth','kg/kg','料肉比(饲料/增重)',false),
(9,'RUMEN_PH','health','pH','瘤胃pH',true),
(10,'ECON','carcass','$/head','每头净收益',true);


-- ===================== D. 外部文献 + 产品-文献关联（策划写实）=====================

INSERT INTO publication (publication_id, title, journal, pub_year, study_type, doi) VALUES
(1,'Effects of Lactobacillus-based DFM on feedlot cattle performance','Journal of Animal Science',2023,'RCT','10.1093/jas/2023.001'),
(2,'Direct-fed microbials improve gain:feed in finishing beef','Animal Feed Science and Technology',2022,'对照','10.1016/afst.2022.015'),
(3,'Probiotic modulation of rumen fermentation in beef cattle','Journal of Animal Science',2021,'RCT','10.1093/jas/2021.077'),
(4,'Meta-analysis of DFM on cattle growth and health','Livestock Science',2023,'荟萃','10.1016/livsci.2023.004'),
(5,'Saccharomyces cerevisiae yeast on dairy milk yield','Journal of Dairy Science',2022,'RCT','10.3168/jds.2022.031'),
(6,'Yeast culture improves rumen stability in lactating cows','Journal of Dairy Science',2021,'对照','10.3168/jds.2021.088'),
(7,'Live yeast reduces subclinical acidosis in dairy','Animal Feed Science and Technology',2023,'RCT','10.1016/afst.2023.021'),
(8,'Rumen buffer (NaHCO3) on feedlot performance','Journal of Animal Science',2020,'对照','10.1093/jas/2020.045'),
(9,'Sodium bicarbonate and acidosis prevention: review','Livestock Science',2019,'综述','10.1016/livsci.2019.012'),
(10,'DFM reduces morbidity in receiving calves','Journal of Animal Science',2023,'RCT','10.1093/jas/2023.110'),
(11,'Probiotics and carcass traits in finishing cattle','Meat Science',2022,'对照','10.1016/meatsci.2022.009'),
(12,'Yeast effects on dairy herd health metrics','Journal of Dairy Science',2023,'RCT','10.3168/jds.2023.140'),
(13,'Economic returns of DFM supplementation','Applied Animal Research',2021,'对照','10.1080/aar.2021.033'),
(14,'Review: direct-fed microbials in ruminants','Animal Feed Science and Technology',2020,'综述','10.1016/afst.2020.007'),
(15,'DFM and gut health biomarkers in cattle','Journal of Animal Science',2024,'RCT','10.1093/jas/2024.002');

INSERT INTO product_publication (product_id, publication_id, evidence_note) VALUES
(1,1,'DFM 提升育肥牛日增重'),
(1,2,'改善增益饲料比'),
(1,3,'调控瘤胃发酵'),
(1,4,'荟萃：生长与健康整体获益'),
(1,10,'降低接收期发病率'),
(1,11,'改善胴体性状'),
(1,13,'经济回报正向'),
(1,14,'综述支持'),
(1,15,'肠道健康生物标志物改善'),
(2,8,'缓冲剂改善育肥表现'),
(2,9,'综述：预防酸中毒'),
(3,5,'酵母提升产奶量'),
(3,6,'稳定瘤胃'),
(3,7,'降低亚临床酸中毒'),
(3,12,'改善牛群健康指标');


-- ===================== E. 报告批次（策划写实）=====================

INSERT INTO report (report_id, rep_id, region_id, batch_no, generated_at, notes) VALUES
(1,1,1,'RPT-2024-001','2024-06-02 09:30:00','Bar T 客户现场试验汇报'),
(2,2,1,'RPT-2024-002','2024-06-10 10:00:00','西南区奶牛场总结'),
(3,3,2,'RPT-2024-003','2024-07-05 14:00:00','中西部育肥场证据包'),
(4,4,2,'RPT-2024-004','2024-07-12 11:00:00','中西部 dairy 进展'),
(5,5,3,'RPT-2024-005','2024-08-01 09:00:00','东南区肉牛试验'),
(6,6,3,'RPT-2024-006','2024-08-09 15:30:00','东南 dairy 营养总结'),
(7,7,4,'RPT-2024-007','2024-08-20 10:00:00','西北育肥场 yeast 试验'),
(8,8,4,'RPT-2024-008','2024-08-28 13:00:00','西北 dairy 总结'),
(9,1,1,'RPT-2024-009','2024-09-05 09:00:00','西南区季度复盘'),
(10,3,2,'RPT-2024-010','2024-09-15 16:00:00','中西部 Q3 证据'),
(11,5,3,'RPT-2024-011','2024-09-22 10:30:00','东南 Q3 汇报'),
(12,7,4,'RPT-2024-012','2024-09-30 14:00:00','西北 Q3 复盘'),
(13,2,1,'RPT-2024-013','2024-10-08 09:30:00','西南区客户跟进'),
(14,4,2,'RPT-2024-014','2024-10-15 11:00:00','中西部跟进'),
(15,6,3,'RPT-2024-015','2024-10-22 15:00:00','东南跟进');


-- ============================================================================
-- 事实表批量生成（依赖上面所有维度表，顺序：亚批次/处理组 → 试验结果 → 牛只/称重 → 报告条目）
-- ============================================================================

-- ① 试验亚批次 + 处理组（每试验 2 个亚批次；每组含 对照/试验，部分试验增设阳性对照）
DO $$
DECLARE
  r_t RECORD;
  v_i INT;
  v_dose NUMERIC(10,4);
  v_unit VARCHAR(16);
  v_route VARCHAR(16) := '拌料(TMR)';
  v_freq  VARCHAR(16) := '每日';
  v_days INT := 140;
BEGIN
  FOR r_t IN
    SELECT t.trial_id, t.product_id
    FROM trial t ORDER BY t.trial_id
  LOOP
    -- 亚批次
    FOR v_i IN 1..2 LOOP
      INSERT INTO trial_batch (trial_batch_id, trial_id, batch_no, enrollment_date, cohort_label, animal_count)
      VALUES (nextval('seed_seq'), r_t.trial_id,
              'TB-' || lpad(r_t.trial_id::text,2,'0') || '-' || v_i,
              ('2024-02-01'::date + (r_t.trial_id*8 + v_i*5)),
              'Cohort ' || chr(64 + v_i),
              180 + floor(random()*120)::int);
    END LOOP;

    -- 对照组
    INSERT INTO treatment_group
      (group_id, trial_id, group_type, dose_rate, dose_unit, admin_route, frequency, duration_days, animal_count, cattle_category, breed)
    VALUES (nextval('seed_seq'), r_t.trial_id, 'CONTROL', 0, NULL, v_route, v_freq, v_days, 200, '阉牛', 'Angus');

    -- 试验组（给药方案按产品）
    IF r_t.product_id = 1 THEN v_dose := 0.5;  v_unit := 'kg/ton';
    ELSIF r_t.product_id = 2 THEN v_dose := 1.2; v_unit := 'kg/ton';
    ELSE v_dose := 2.0; v_unit := 'g/head/day'; END IF;
    INSERT INTO treatment_group
      (group_id, trial_id, group_type, dose_rate, dose_unit, admin_route, frequency, duration_days, animal_count, cattle_category, breed)
    VALUES (nextval('seed_seq'), r_t.trial_id, 'TREATMENT', v_dose, v_unit, v_route, v_freq, v_days, 200, '阉牛', 'Angus');

    -- 部分试验增设阳性对照
    IF r_t.trial_id IN (1,4,6,9) THEN
      INSERT INTO treatment_group
        (group_id, trial_id, group_type, dose_rate, dose_unit, admin_route, frequency, duration_days, animal_count, cattle_category, breed)
      VALUES (nextval('seed_seq'), r_t.trial_id, 'POSITIVE_CONTROL', 0.4, 'kg/ton', v_route, v_freq, v_days, 200, '阉牛', 'Angus');
    END IF;
  END LOOP;
END $$;

-- ② 试验结果（每处理组 × 每指标一行；试验组按 higher_is_better 方向施加提升 + 噪声）
DO $$
DECLARE
  r_g RECORD;
  r_m RECORD;
  v_base NUMERIC;
  v_lift NUMERIC;
  v_sig  BOOLEAN;
  v_sign INT;
  v_factor NUMERIC;
  v_val  NUMERIC;
  v_n    INT;
  v_sd   NUMERIC;
  v_p    NUMERIC(12,6);
  v_ci_l NUMERIC;
  v_ci_h NUMERIC;
  v_period INT;
BEGIN
  FOR r_g IN
    SELECT tg.group_id, tg.trial_id, tg.group_type, t.end_date, t.start_date
    FROM treatment_group tg
    JOIN trial t ON t.trial_id = tg.trial_id
    ORDER BY tg.group_id
  LOOP
    v_period := (r_g.end_date - r_g.start_date);  -- 天数(整数)
    FOR r_m IN
      SELECT metric_id, metric_code, higher_is_better FROM metric_definition ORDER BY metric_id
    LOOP
      CASE r_m.metric_code
        WHEN 'ADG'      THEN v_base:=1.45; v_lift:=0.09;  v_sig:=true;
        WHEN 'GF'       THEN v_base:=0.155;v_lift:=0.08;  v_sig:=true;
        WHEN 'HCW'      THEN v_base:=340;  v_lift:=0.035; v_sig:=true;
        WHEN 'DMI'      THEN v_base:=10.2; v_lift:=0.04;  v_sig:=true;
        WHEN 'MORB'     THEN v_base:=6.5;  v_lift:=0.45;  v_sig:=true;
        WHEN 'MORT'     THEN v_base:=1.8;  v_lift:=0.5;   v_sig:=true;
        WHEN 'DRESS'    THEN v_base:=62.5; v_lift:=0.012; v_sig:=false;
        WHEN 'FCR'      THEN v_base:=6.4;  v_lift:=0.06;  v_sig:=true;
        WHEN 'RUMEN_PH' THEN v_base:=6.1;  v_lift:=0.06;  v_sig:=false;
        WHEN 'ECON'     THEN v_base:=95;   v_lift:=0.12;  v_sig:=true;
        ELSE                 v_base:=1.0;  v_lift:=0.05;  v_sig:=false;
      END CASE;

      v_sign := CASE WHEN r_m.higher_is_better THEN 1 ELSE -1 END;
      IF r_g.group_type IN ('TREATMENT','POSITIVE_CONTROL') THEN
        v_factor := 1 + v_sign * v_lift;
      ELSE
        v_factor := 1;
      END IF;

      v_val := v_base * v_factor + (random()-0.5) * v_base * 0.05;
      v_n   := 40 + floor(random()*40)::int;
      v_sd  := v_base * 0.08;
      IF v_sig THEN
        v_p := round((0.005 + random()*0.03)::numeric, 6);
      ELSE
        v_p := round((0.10 + random()*0.15)::numeric, 6);
      END IF;
      v_ci_l := round((v_val - 1.96 * v_sd / sqrt(v_n))::numeric, 4);
      v_ci_h := round((v_val + 1.96 * v_sd / sqrt(v_n))::numeric, 4);

      INSERT INTO trial_result
        (result_id, trial_id, group_id, metric_id, metric_value, n, std_dev, p_value, ci_lower, ci_upper, measurement_date, period_day)
      VALUES (nextval('seed_seq'), r_g.trial_id, r_g.group_id, r_m.metric_id,
              round(v_val,4), v_n, round(v_sd,4), v_p, v_ci_l, v_ci_h, r_g.end_date, v_period);
    END LOOP;
  END LOOP;
END $$;

-- ③ 牛只 + 称重事件（每处理组 15-25 头；每头 入场/中期/出栏 三次称重）
DO $$
DECLARE
  r_g RECORD;
  v_n INT;
  v_i INT;
  v_aid INT;
  v_entry NUMERIC(10,2);
  v_exit  NUMERIC(10,2);
  v_mid   NUMERIC(10,2);
  v_sex   VARCHAR(1);
  v_status VARCHAR(16);
  v_base  DATE;
BEGIN
  FOR r_g IN
    SELECT tg.group_id, tg.trial_id, tb.trial_batch_id
    FROM treatment_group tg
    JOIN trial_batch tb ON tb.trial_id = tg.trial_id
    ORDER BY tg.group_id, tb.trial_batch_id
  LOOP
    v_n := 15 + floor(random()*11)::int;   -- 每处理组 15-25 头
    FOR v_i IN 1..v_n LOOP
      v_aid   := nextval('seed_seq');
      v_entry := round((360 + random()*140)::numeric, 1);
      v_exit  := round((v_entry + 160 + random()*160)::numeric, 1);
      v_sex   := CASE WHEN random() < 0.5 THEN 'M' ELSE 'F' END;
      v_status:= CASE WHEN random() < 0.93 THEN 'alive'
                      WHEN random() < 0.85 THEN 'culled'
                      ELSE 'died' END;

      INSERT INTO animal (animal_id, group_id, batch_id, ear_tag, sex, entry_weight, exit_weight, status)
      VALUES (v_aid, r_g.group_id, r_g.trial_batch_id, 'ET-' || lpad(v_aid::text,6,'0'),
              v_sex, v_entry, v_exit, v_status);

      v_base := ('2024-02-01'::date + (r_g.trial_id*8));
      INSERT INTO weigh_event (weigh_id, animal_id, weigh_date, weight, event_type)
      VALUES (nextval('seed_seq'), v_aid, v_base, v_entry, '入场');
      v_mid := round((v_entry + (v_exit - v_entry)*0.5)::numeric, 1);
      INSERT INTO weigh_event (weigh_id, animal_id, weigh_date, weight, event_type)
      VALUES (nextval('seed_seq'), v_aid, v_base + 70, v_mid, '中期');
      INSERT INTO weigh_event (weigh_id, animal_id, weigh_date, weight, event_type)
      VALUES (nextval('seed_seq'), v_aid, v_base + 140, v_exit, '出栏');
    END LOOP;
  END LOOP;
END $$;

-- ④ 报告条目（每报告 2-4 条，随机引用内部试验或外部文献；含试验条目时触发器自动维护报告分级）
DO $$
DECLARE
  r_r RECORD;
  v_k INT;
  v_i INT;
  v_tid INT;
  v_pid INT;
BEGIN
  FOR r_r IN SELECT report_id FROM report ORDER BY report_id LOOP
    v_k := 2 + floor(random()*3)::int;   -- 2-4 条
    FOR v_i IN 1..v_k LOOP
      IF random() < 0.6 THEN
        v_tid := 1 + floor(random()*10)::int;   -- 引用试验 1-10
        v_pid := NULL;
      ELSE
        v_tid := NULL;
        v_pid := 1 + floor(random()*15)::int;   -- 引用文献 1-15
      END IF;
      INSERT INTO report_item (item_id, report_id, trial_id, publication_id)
      VALUES (nextval('seed_seq'), r_r.report_id, v_tid, v_pid);
    END LOOP;
  END LOOP;
END $$;

-- 演示：为两条客户专属报告显式钉入 confidential 试验(2/7)，触发报告分级派生为 customer_confidential
INSERT INTO report_item (item_id, report_id, trial_id, publication_id) VALUES
  (nextval('seed_seq'), 1, 2, NULL),
  (nextval('seed_seq'), 7, 7, NULL);


-- ============================================================================
-- 说明：seed_seq 为临时序列，数据灌完后已不再使用；
-- 旧版 DROP SEQUENCE 会导致某些客户端工具渲染空结果集时报 TypeError，
-- 如需清理请在单独会话执行：DROP SEQUENCE IF EXISTS seed_seq;
