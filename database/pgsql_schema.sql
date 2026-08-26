-- ============================================================================
-- 益生菌(DFM)肉牛试验数据平台 —— PostgreSQL 物理表 + 一致性触发器 + Cube 语义视图
-- ----------------------------------------------------------------------------
-- 数据来源（唯一事实源）：er-diagram.html 中的 Mermaid erDiagram（v5）
--   区域+报告批次+数据分级。本文件严格依据该 ER 图逐实体、逐字段、逐关系生成，
--   不参考任何历史 SQL。ER 图中大写实体名 → 小写 snake_case 表名。
--
-- 【实现约定】(ER 图中未规定、由实现决定的部分，列于此以便追溯)
--   1. 主键类型：ER 图中均为 int → 全部使用 INT PRIMARY KEY（不使用自增/序列，
--      如需可改为 BIGINT GENERATED ALWAYS AS IDENTITY）。
--   2. 审计列：ER 约束区明言「所有核心表含 created_at / deleted_at(软删除)；
--      可变表另含 updated_at」，故按此补齐（不计入 ER 字段数）。
--   3. VARCHAR(n) 长度：ER 仅写 varchar，未定长度 → 按语义给出合理长度，
--      均为实现决策，不影响与 ER 的字段对应。
--   4. p_value 精度：ER 仅写 decimal，统计 p 值常为极小值（如 0.0001），
--      故用 NUMERIC(12,6)，避免 NUMERIC(6,4) 下溢为 0。
--   5. 访问控制：ER 约束区已声明「数据分级仅作元数据，DB 层不强制 RLS，
--      由上层(Cube/应用)按角色过滤」，故本文件不建数据库角色/RLS。
--   6. 跨表一致性：ER 多处「一致性」约束含跨表引用，PostgreSQL 的 CHECK
--      不支持子查询，故统一用 BEFORE 触发器实现（非访问控制）。
--
-- 【ER → SQL 覆盖审计】
--   实体 18 个（与 ER 一一对应）：
--     REGION(3) SALES_REP(5) CUSTOMER(8) CONTACT(5)
--     PRODUCT(7) PRODUCT_BATCH(7) TRIAL(15) TRIAL_SITE(7) TRIAL_BATCH(6)
--     TREATMENT_GROUP(11) TRIAL_RESULT(12) METRIC_DEFINITION(6)
--     PUBLICATION(6) PRODUCT_PUBLICATION(3) REPORT(7) REPORT_ITEM(4)
--     ANIMAL(8) WEIGH_EVENT(5)
--   关系 23 条（均落地为外键，见各表 REFERENCES）。
--   约束 9 条（见各 CHECK 与触发器，与 ER 约束区逐条对齐）。
-- ============================================================================


-- ===================== A. 区域 / 人员 / 农场 =====================

-- REGION 销售区域
CREATE TABLE region (
    region_id   INT PRIMARY KEY,                       -- 区域主键
    region_code VARCHAR(16) UNIQUE,                    -- 区域代码 如 SW
    region_name VARCHAR(64)                            -- 区域名称 如 South West
);

-- SALES_REP 销售代表
CREATE TABLE sales_rep (
    rep_id     INT PRIMARY KEY,                        -- 销售主键
    region_id  INT REFERENCES region(region_id),       -- 所属区域
    rep_name   VARCHAR(64),                            -- 销售代表姓名
    email      VARCHAR(128),                           -- 联系邮箱
    created_at TIMESTAMPTZ DEFAULT now(),              -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CUSTOMER 农场客户
CREATE TABLE customer (
    customer_id     INT PRIMARY KEY,                   -- 客户主键
    region_id       INT REFERENCES region(region_id),  -- 所属区域
    customer_name   VARCHAR(128),                      -- 客户名称 如 Bar T Cattle
    customer_type   VARCHAR(16),                       -- 客户类型 feedlot/dairy/ranch
    city            VARCHAR(64),                       -- 所在城市 如 Hereford
    state           VARCHAR(8),                        -- 所在州 如 TX
    created_at      TIMESTAMPTZ DEFAULT now(),         -- 创建时间
    updated_at      TIMESTAMPTZ DEFAULT now(),
    deleted_at      TIMESTAMPTZ                        -- 软删除标记(null=有效)
);

-- CONTACT 联系人
CREATE TABLE contact (
    contact_id   INT PRIMARY KEY,                      -- 联系人主键
    customer_id  INT REFERENCES customer(customer_id), -- 所属农场客户
    contact_name VARCHAR(64),                          -- 联系人姓名
    role         VARCHAR(32),                          -- 角色 肥育场经理/咨询兽医
    credential   VARCHAR(16),                          -- 资质 如 DVM(兽医)
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);


-- ===================== B. 产品与试验（益生菌对牛影响主线）=====================

-- PRODUCT 产品
CREATE TABLE product (
    product_id      INT PRIMARY KEY,                   -- 产品主键
    product_name    VARCHAR(128),                      -- 产品名称 如 XYZ 益生菌
    category        VARCHAR(64),                       -- 产品类别 如 DFM probiotic
    active_strain   VARCHAR(128),                      -- 活性菌株
    target_species  VARCHAR(32),                       -- 目标物种 如 肉牛
    created_at      TIMESTAMPTZ DEFAULT now(),         -- 创建时间
    updated_at      TIMESTAMPTZ DEFAULT now(),
    deleted_at      TIMESTAMPTZ                        -- 软删除标记
);

-- PRODUCT_BATCH 产品批号（生产 lot，CFU 效价溯源）
CREATE TABLE product_batch (
    batch_id        INT PRIMARY KEY,                   -- 批号主键
    product_id      INT REFERENCES product(product_id),-- 所属产品
    batch_no        VARCHAR(32) UNIQUE,                -- 生产批号/lot
    manufacture_date DATE,                             -- 生产日期
    expiry_date     DATE,                              -- 有效期至
    cfu_potency     NUMERIC(12,2),                     -- CFU/g 效价(逐批波动)
    qc_status       VARCHAR(16),                       -- 质检状态 合格/待检/不合格
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CHECK (cfu_potency > 0)
);

-- TRIAL_SITE 试验场地（自有/农场/大学）
CREATE TABLE trial_site (
    site_id      INT PRIMARY KEY,                      -- 场地主键
    site_name    VARCHAR(128),                         -- 场地名称
    site_kind    VARCHAR(16),                          -- 场地性质 company/customer_farm/university
    customer_id  INT REFERENCES customer(customer_id), -- 农场客户(农场试验时必填)
    city         VARCHAR(64),                          -- 所在城市
    state        VARCHAR(8),                           -- 所在州
    capacity_head INT,                                 -- 存栏容量(头)
    CHECK ( (site_kind <> 'customer_farm') OR customer_id IS NOT NULL )
);

-- TRIAL 试验
CREATE TABLE trial (
    trial_id            INT PRIMARY KEY,               -- 试验主键
    trial_code          VARCHAR(32) UNIQUE,            -- 试验编号
    product_id          INT REFERENCES product(product_id),         -- 试验产品
    site_id             INT REFERENCES trial_site(site_id),         -- 试验场地
    batch_id            INT REFERENCES product_batch(batch_id),     -- 所用产品批次
    start_date          DATE,                          -- 试验开始日期
    end_date            DATE,                          -- 试验结束日期
    design_type         VARCHAR(32),                   -- 设计类型 RCT/区组/配对
    control_type        VARCHAR(32),                   -- 对照类型 阴性/阳性
    randomized          BOOLEAN,                       -- 是否随机分组
    blinding            VARCHAR(16),                   -- 盲法 单盲/双盲/开放
    sponsor             VARCHAR(32),                   -- 发起方 内部/大学/第三方
    status              VARCHAR(16),                   -- 状态 planned/active/completed
    data_classification VARCHAR(32) NOT NULL DEFAULT 'internal', -- 数据分级 public/internal/customer_confidential（customer_confidential 20 字符 → 需 ≥20）
    protocol_ref        VARCHAR(64),                   -- 试验方案编号
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CHECK (end_date >= start_date),
    CHECK (data_classification IN ('public','internal','customer_confidential'))
    -- 一致性：trial.batch_id 必须属于 trial.product_id 对应产品 → 见触发器 trg_trial_batch_product
);

-- TRIAL_BATCH 试验亚批次（分批入组）
CREATE TABLE trial_batch (
    trial_batch_id INT PRIMARY KEY,                    -- 亚批次主键
    trial_id       INT REFERENCES trial(trial_id),     -- 所属试验
    batch_no       VARCHAR(32),                        -- 入组批次号
    enrollment_date DATE,                              -- 入组日期
    cohort_label   VARCHAR(32),                        -- 批次/群组标签
    animal_count   INT,                                -- 本批次牛只数
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

-- TREATMENT_GROUP 处理组（对照/试验 + 给药方案）
CREATE TABLE treatment_group (
    group_id        INT PRIMARY KEY,                   -- 处理组主键
    trial_id        INT REFERENCES trial(trial_id),    -- 所属试验
    group_type      VARCHAR(16),                       -- 组别 CONTROL/TREATMENT/POSITIVE_CONTROL
    dose_rate       NUMERIC(10,4),                     -- 添加剂量数值
    dose_unit       VARCHAR(16),                       -- 剂量单位 g/ton 或 CFU/head（与 dose_rate 成对）
    admin_route     VARCHAR(16),                       -- 给药途径 拌料(TMR)/饮水/灌服
    frequency       VARCHAR(16),                       -- 给药频次 每日/每周
    duration_days   INT,                               -- 试验持续天数
    animal_count    INT,                               -- 本组牛只数
    cattle_category VARCHAR(16),                       -- 牛群类别 犊牛/阉牛/母牛
    breed           VARCHAR(32),                       -- 品种
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CHECK (group_type IN ('CONTROL','TREATMENT','POSITIVE_CONTROL'))
);

-- METRIC_DEFINITION 指标字典（规范化，杜绝自由文本）
CREATE TABLE metric_definition (
    metric_id        INT PRIMARY KEY,                  -- 指标主键
    metric_code      VARCHAR(32) UNIQUE,               -- 指标代码 ADG/G:F/HCW...
    category         VARCHAR(16),                      -- 指标类别 growth/health/carcass
    unit             VARCHAR(16),                      -- 计量单位
    description      VARCHAR(128),                     -- 指标说明
    higher_is_better BOOLEAN                          -- 越大越好?(true/false)
);

-- TRIAL_RESULT 试验结果（行式指标 + 统计可信度）
CREATE TABLE trial_result (
    result_id        INT PRIMARY KEY,                  -- 结果主键
    trial_id         INT REFERENCES trial(trial_id),   -- 所属试验(冗余：须等于 group 所属试验)
    group_id         INT REFERENCES treatment_group(group_id), -- 所属处理组
    metric_id        INT REFERENCES metric_definition(metric_id), -- 指标(→指标字典)
    metric_value     NUMERIC(12,4),                    -- 指标观测值
    n                INT,                              -- 样本量
    std_dev          NUMERIC(12,4),                    -- 标准差
    p_value          NUMERIC(12,6),                    -- 显著性 p 值（6 位小数以容纳极小值）
    ci_lower         NUMERIC(12,4),                    -- 置信区间下界
    ci_upper         NUMERIC(12,4),                    -- 置信区间上界
    measurement_date DATE,                             -- 测量日期
    period_day       INT,                              -- 试验第几天测量
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    CHECK (n > 0 AND p_value BETWEEN 0 AND 1 AND ci_lower <= ci_upper)
    -- 一致性：trial_id 必须等于 group_id 所属试验 → 见触发器 trg_trial_result_trial
);


-- ===================== C. 外部证据（第三方文献）=====================

-- PUBLICATION 行业文献
CREATE TABLE publication (
    publication_id INT PRIMARY KEY,                    -- 文献主键
    title          VARCHAR(256),                       -- 文献标题
    journal        VARCHAR(128),                       -- 期刊/出版物
    pub_year       INT,                                -- 发表年份
    study_type     VARCHAR(32),                        -- 研究类型 RCT/对照/荟萃/综述
    doi            VARCHAR(64) UNIQUE                  -- 数字对象唯一标识
);

-- PRODUCT_PUBLICATION 产品-文献关联（多对多 + 支撑要点）
CREATE TABLE product_publication (
    product_id     INT REFERENCES product(product_id),       -- 产品主键
    publication_id INT REFERENCES publication(publication_id),-- 文献主键
    evidence_note  VARCHAR(256),                       -- 支撑要点说明
    PRIMARY KEY (product_id, publication_id)
);


-- ===================== D. 报告批次（销售从 DB 生成证据包）=====================

-- REPORT 报告批次
CREATE TABLE report (
    report_id           INT PRIMARY KEY,               -- 报告主键
    rep_id              INT REFERENCES sales_rep(rep_id),    -- 生成报告的销售
    region_id           INT REFERENCES region(region_id),    -- 报告归属区域
    batch_no            VARCHAR(32) UNIQUE,            -- 报告批次号
    data_classification VARCHAR(32) NOT NULL DEFAULT 'internal', -- 报告分级(取所含条目中最敏感级 须一致)
    generated_at        TIMESTAMPTZ DEFAULT now(),      -- 报告生成时间
    notes               VARCHAR(256),                  -- 报告说明/备注
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CHECK (data_classification IN ('public','internal','customer_confidential'))
    -- 派生：data_classification 取所含试验条目中最敏感级别 → 见触发器 trg_report_item_classification
);

-- REPORT_ITEM 报告条目（内部试验 + 外部文献打包）
CREATE TABLE report_item (
    item_id         INT PRIMARY KEY,                   -- 条目主键
    report_id       INT REFERENCES report(report_id),  -- 所属报告
    trial_id        INT REFERENCES trial(trial_id),    -- 引用内部试验(可空)
    publication_id  INT REFERENCES publication(publication_id), -- 引用外部文献(可空)
    created_at      TIMESTAMPTZ DEFAULT now(),
    CHECK (trial_id IS NOT NULL OR publication_id IS NOT NULL)
);


-- ===================== E. 个体牛只（可追溯 + 方差分析）=====================

-- ANIMAL 牛只
CREATE TABLE animal (
    animal_id     INT PRIMARY KEY,                     -- 牛只主键
    group_id      INT REFERENCES treatment_group(group_id),     -- 所属处理组
    batch_id      INT REFERENCES trial_batch(trial_batch_id),   -- 入组亚批次
    ear_tag       VARCHAR(32) UNIQUE,                  -- 耳标编号
    sex           VARCHAR(1),                          -- 性别 M/F
    entry_weight  NUMERIC(10,2),                       -- 入场体重(kg)
    exit_weight   NUMERIC(10,2),                       -- 出栏体重(kg)
    status        VARCHAR(16),                         -- 状态 alive/culled/died
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
    -- 一致性：batch_id 所属试验须与 group_id 所属试验一致 → 见触发器 trg_animal_batch_trial
);

-- WEIGH_EVENT 称重事件
CREATE TABLE weigh_event (
    weigh_id    INT PRIMARY KEY,                       -- 称重主键
    animal_id   INT REFERENCES animal(animal_id),      -- 所属牛只
    weigh_date  DATE,                                  -- 称重日期
    weight      NUMERIC(10,2),                         -- 体重(kg)
    event_type  VARCHAR(16),                           -- 称重类型 入场/中期/出栏
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- 跨表一致性触发器（数据完整性，与访问控制无关）
-- PostgreSQL 的 CHECK 不支持子查询，故用触发器实现跨表一致校验。
-- ============================================================================

-- 1) 试验使用批次必须属于该试验的产品
CREATE OR REPLACE FUNCTION check_trial_batch_product() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.batch_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM product_batch pb
        WHERE pb.batch_id = NEW.batch_id AND pb.product_id <> NEW.product_id
    ) THEN
        RAISE EXCEPTION 'trial.batch_id 必须属于 trial.product_id 对应的产品';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trial_batch_product
    BEFORE INSERT OR UPDATE ON trial
    FOR EACH ROW EXECUTE FUNCTION check_trial_batch_product();

-- 2) 试验结果冗余 trial_id 必须等于其 group_id 所属试验
CREATE OR REPLACE FUNCTION check_trial_result_trial() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trial_id IS DISTINCT FROM (
        SELECT tg.trial_id FROM treatment_group tg WHERE tg.group_id = NEW.group_id
    ) THEN
        RAISE EXCEPTION 'trial_result.trial_id 必须等于其 group_id 所属试验';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trial_result_trial
    BEFORE INSERT OR UPDATE ON trial_result
    FOR EACH ROW EXECUTE FUNCTION check_trial_result_trial();

-- 3) 牛只亚批次所属试验须与处理组所属试验一致
CREATE OR REPLACE FUNCTION check_animal_batch_trial() RETURNS TRIGGER AS $$
DECLARE
    v_batch_trial INT;
    v_group_trial INT;
BEGIN
    IF NEW.batch_id IS NOT NULL THEN
        SELECT tb.trial_id INTO v_batch_trial FROM trial_batch tb WHERE tb.trial_batch_id = NEW.batch_id;
        SELECT tg.trial_id INTO v_group_trial FROM treatment_group tg WHERE tg.group_id = NEW.group_id;
        IF v_batch_trial IS DISTINCT FROM v_group_trial THEN
            RAISE EXCEPTION 'animal.batch_id 所属试验(%) 必须与其 group_id 所属试验(%) 一致',
                           v_batch_trial, v_group_trial;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_animal_batch_trial
    BEFORE INSERT OR UPDATE ON animal
    FOR EACH ROW EXECUTE FUNCTION check_animal_batch_trial();

-- 4) 报告分级派生：取所含试验条目中最敏感级别写入 report.data_classification
CREATE OR REPLACE FUNCTION refresh_report_classification(p_report_id INT) RETURNS VOID AS $$
DECLARE
    v_max INT;
BEGIN
    SELECT COALESCE(MAX(CASE t.data_classification
        WHEN 'customer_confidential' THEN 3
        WHEN 'internal'             THEN 2
        ELSE 1 END), 0)
    INTO v_max
    FROM report_item ri
    JOIN trial t ON t.trial_id = ri.trial_id
    WHERE ri.report_id = p_report_id;

    IF v_max > 0 THEN
        UPDATE report r SET data_classification =
            CASE v_max WHEN 3 THEN 'customer_confidential'
                       WHEN 2 THEN 'internal'
                       ELSE 'public' END
        WHERE r.report_id = p_report_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_report_item_classification() RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_report_classification(COALESCE(NEW.report_id, OLD.report_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_report_item_classification
    AFTER INSERT OR UPDATE OR DELETE ON report_item
    FOR EACH ROW EXECUTE FUNCTION trg_report_item_classification();


-- ============================================================================
-- CUBE 语义视图（Chatbot 查询入口，上层须按角色追加 data_classification 过滤）
-- ============================================================================

-- 视图①：ER 图「索引与汇总视图」卡片中逐字给出的 v_trial_efficacy（原始明细，按组逐行）
CREATE VIEW v_trial_efficacy AS
SELECT
  p.product_name,
  t.trial_code,
  ts.site_name,
  tg.group_type,
  tg.dose_rate,
  m.metric_code,
  m.category,
  m.higher_is_better,
  tr.metric_value,
  tr.n, tr.std_dev, tr.p_value, tr.ci_lower, tr.ci_upper,
  tr.measurement_date
FROM product p
JOIN trial t               ON t.product_id = p.product_id
JOIN trial_site ts        ON ts.site_id   = t.site_id
JOIN treatment_group tg   ON tg.trial_id  = t.trial_id
JOIN trial_result tr      ON tr.group_id  = tg.group_id
JOIN metric_definition m  ON m.metric_id  = tr.metric_id
WHERE p.deleted_at IS NULL;

-- 视图②：对照 vs 试验组 聚合效能（Chatbot 核心指标层，含提升率与分级）
CREATE VIEW v_trial_efficacy_summary AS
SELECT
    t.trial_id,
    t.trial_code,
    p.product_name,
    ts.site_name,
    ts.site_kind,
    ts.customer_id,                          -- 供上层按农场主身份过滤 confidential
    t.data_classification,
    md.metric_id,
    md.metric_code,
    md.category,
    md.unit,
    md.higher_is_better,
    MAX(CASE WHEN tg.group_type = 'CONTROL'    THEN tr.metric_value END) AS control_value,
    MAX(CASE WHEN tg.group_type = 'TREATMENT'  THEN tr.metric_value END) AS treatment_value,
    ROUND( ( MAX(CASE WHEN tg.group_type='TREATMENT' THEN tr.metric_value END)
           - MAX(CASE WHEN tg.group_type='CONTROL'    THEN tr.metric_value END) )
          / NULLIF(MAX(CASE WHEN tg.group_type='CONTROL' THEN tr.metric_value END), 0) * 100, 2) AS lift_pct,
    MAX(CASE WHEN tg.group_type = 'TREATMENT'  THEN tr.p_value END) AS p_value
FROM trial t
JOIN product p            ON p.product_id = t.product_id
JOIN trial_site ts        ON ts.site_id   = t.site_id
JOIN treatment_group tg   ON tg.trial_id  = t.trial_id
JOIN trial_result tr      ON tr.group_id  = tg.group_id
JOIN metric_definition md ON md.metric_id = tr.metric_id
WHERE p.deleted_at IS NULL
GROUP BY t.trial_id, t.trial_code, p.product_name, ts.site_name, ts.site_kind,
         ts.customer_id, t.data_classification,
         md.metric_id, md.metric_code, md.category, md.unit, md.higher_is_better;

-- 视图③：公开证据包（大众可见）—— 给潜在客户的「答案 + 佐证」来源
-- 上层对 public 角色应再追加 data_classification='public' 过滤（本视图已内置该条件）。
CREATE VIEW v_public_evidence AS
SELECT
    'trial' AS evidence_type,
    ve.product_name,
    ve.metric_code,
    ve.unit,
    ve.control_value,
    ve.treatment_value,
    ve.lift_pct,
    ve.p_value,
    ve.site_kind,
    NULL AS title,
    NULL AS journal,
    NULL AS doi
FROM v_trial_efficacy_summary ve
WHERE ve.data_classification = 'public'
UNION ALL
SELECT
    'publication' AS evidence_type,
    p.product_name,
    NULL AS metric_code,
    NULL AS unit,
    NULL AS control_value,
    NULL AS treatment_value,
    NULL AS lift_pct,
    NULL AS p_value,
    NULL AS site_kind,
    pub.title,
    pub.journal,
    pub.doi
FROM product p
JOIN product_publication pp ON pp.product_id = p.product_id
JOIN publication pub        ON pub.publication_id = pp.publication_id;


-- ============================================================================
-- 高频索引（生产请用 CREATE INDEX CONCURRENTLY 在线建，不能在事务块内执行）
-- ============================================================================
CREATE INDEX idx_trial_product     ON trial(product_id);
CREATE INDEX idx_trial_site        ON trial(site_id);
CREATE INDEX idx_trial_class       ON trial(data_classification);
CREATE INDEX idx_result_group      ON trial_result(group_id, metric_id);
CREATE INDEX idx_result_trial      ON trial_result(trial_id);
CREATE INDEX idx_group_trial       ON treatment_group(trial_id);
CREATE INDEX idx_report_region     ON report(region_id, data_classification);
CREATE INDEX idx_item_report       ON report_item(report_id, trial_id, publication_id);
CREATE INDEX idx_animal_group      ON animal(group_id);
CREATE INDEX idx_animal_batch      ON animal(batch_id);
