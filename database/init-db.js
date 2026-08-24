const { Client } = require('pg');

const NEON_URL = process.env.NEON_DIRECT_URL;
if (!NEON_URL) {
  console.error(
    'Error: NEON_DIRECT_URL environment variable is not set.\n' +
      'Set your Neon Direct connection string to initialize the database.\n' +
      'From the database/ directory run:\n' +
      '  NEON_DIRECT_URL="postgresql://user:pass@host:5432/neondb" node init-db.js'
  );
  process.exit(1);
}

const client = new Client({ connectionString: NEON_URL });

// ------------------------------------------------------------------
// SQL templates
// ------------------------------------------------------------------
const insertRegion      = 'INSERT INTO regions (name, code, desc) VALUES ($1, $2, $3)';
const insertSalesRep    = 'INSERT INTO sales_reps (name, email, phone, region_id, region, territory) VALUES ($1, $2, $3, $4, $5, $6)';
const insertCustomer    = 'INSERT INTO customers (name, city, state, zip, region, contact_name, contact_title, head_count, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
const insertProduct     = 'INSERT INTO products (name, category, description, dosage_unit, dosage_rate) VALUES ($1, $2, $3, $4, $5)';
const insertTrial       = 'INSERT INTO trials (trial_name, trial_type, product_id, product_name, customer_id, customer_name, start_date, end_date, duration_days, location, status, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
const insertResult      = 'INSERT INTO trial_results (trial_id, trial_name, group_type, metric_name, metric_value, unit, sample_size, p_value, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
const insertParam       = 'INSERT INTO trial_parameters (trial_id, trial_name, param_name, param_value, unit, notes) VALUES ($1, $2, $3, $4, $5, $6)';
const insertPublication = 'INSERT INTO publications (title, authors, journal, year, volume, pages, doi, url, summary, relevance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
const insertRef         = 'INSERT INTO trial_references (trial_id, trial_name, publication_id, publication_title, citation_note) VALUES ($1, $2, $3, $4, $5)';
const insertVisit       = 'INSERT INTO customer_visits (rep_id, rep_name, customer_id, customer_name, visit_date, purpose, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)';

// ------------------------------------------------------------------
// 1. Regions
// ------------------------------------------------------------------
const regions = [
  ['South West',     'SW', 'Texas Panhandle and eastern New Mexico'],
  ['South Central',  'SC', 'Central Oklahoma and north-central Texas'],
  ['Northeast',      'NE', 'Western Kansas, Nebraska, and Iowa'],
  ['Northwest',      'NW', 'Montana, Wyoming, and the Dakotas'],
  ['Southeast',      'SE', 'Louisiana, Arkansas, and Mississippi'],
];

// ------------------------------------------------------------------
// 2. Sales Reps
// ------------------------------------------------------------------
const salesReps = [
  ['Mike Torres',     'mike.torres@rangelandnutrition.com',     '806-374-2291', 1, 'South West',     'TX Panhandle (Hereford-Dalhart corridor)'],
  ['Sarah Chen',      'sarah.chen@rangelandnutrition.com',      '806-655-1180', 1, 'South West',     'Canyon-Amarillo-Pampa'],
  ['David Patterson', 'david.patterson@rangelandnutrition.com', '580-338-5565', 2, 'South Central',  'Western Oklahoma (Guymon, Beaver)'],
  ['Jennifer Hayes',  'jennifer.hayes@rangelandnutrition.com',  '620-275-9013', 3, 'Northeast',      'Garden City / Dodge City'],
  ['Robert Kim',      'robert.kim@rangelandnutrition.com',      '308-324-4477', 3, 'Northeast',      'Central Nebraska (Lexington, N. Platte)'],
  ['Amanda Reed',     'amanda.reed@rangelandnutrition.com',     '318-437-2210', 5, 'Southeast',      'Northwest Louisiana'],
  ['Thomas Becker',   'thomas.becker@rangelandnutrition.com',   '406-245-7788', 4, 'Northwest',      'Eastern Montana'],
  ['Kelly Ortiz',     'kelly.ortiz@rangelandnutrition.com',     '580-256-3344', 2, 'South Central',  'Central Oklahoma (Woodward, Elk City)'],
];

// ------------------------------------------------------------------
// 3. Customers (feedlots)
// ------------------------------------------------------------------
const customers = [
  ['Circle H Feeders',          'Hereford',     'TX', '79045', 'South West',     'Tom Henderson',    'Feedlot Manager',   3150, "Long-standing account. Tom's run our DFM through one pen since '21. Wants hard numbers before committing the whole yard."],
  ['Lone Star Feeders',         'Gainesville',  'TX', '76240', 'South West',     'James Carter',     'Owner / GM',        5420, "Family operation, 3rd gen. Data-driven, asks for ADG and FCR every visit. Skeptical of anything 'new'."],
  ['High Plains Cattle Co.',    'Dalhart',      'TX', '79022', 'South West',     'Linda Ruiz',       'Consulting Vet',    2680, "Vet makes the call here. Owner defers to her on anything health related. Get Dr. Ruiz on board first."],
  ['Red River Cattle Co.',      'Borger',       'TX', '79007', 'South West',     'Steve Mitchell',   'Feedlot Manager',   4075, "High throughput, thin margins. Price matters more than performance claims. Always gets competitive quotes."],
  ['Panhandle Feedlot LLC',     'Pampa',        'TX', '79065', 'South West',     'Karen Wells',      'Feedlot Manager',   3580, "Ran a probiotic trial with a competitor 2 yrs ago, results were meh. Needs a real reason to switch."],
  ['Canyon View Beef',          'Canyon',       'TX', '79015', 'South West',     'Rick O\'Brien',     'Owner',             2210, "Small yard, hands-on owner. Rick walks pens daily and notices small changes the reports miss."],
  ['Amarillo Prime Feeders',    'Amarillo',     'TX', '79109', 'South West',     'Patricia Dunn',    'Operations Director', 6100, "Large custom feeder. Multiple nutritionists on staff. Hard to get a trial approved, lots of paperwork."],
  ['Kiamichi Cattle Co.',       'Guymon',       'OK', '73942', 'South Central',  'Pat Sullivan',     'Owner',             4850, "OK panhandle. Pat watches feed cost per ton like a hawk. Lead with FCR and ROI, not ADG."],
  ['Beaver County Feeders',     'Beaver',       'OK', '73932', 'South Central',  'Mark Eaton',       'Feedlot Manager',   3320, "Small-town yard. Mark's been in this business 30 yrs and trusts his gut. Build rapport before pitching."],
  ['Cimarron Feeders',          'Elk City',     'OK', '73644', 'South Central',  'Angela Brooks',    'Nutritionist',      2950, "Hires an outside nutritionist. Angela reviews every additive spec. Needs NPN and label detail up front."],
  ['Canadian River Feeders',    'Woodward',     'OK', '73801', 'South Central',  'Greg Holloway',    'Owner',             5600, "Greg expanded the yard 2 yrs ago. Open to new programs if ROI is clear. Wants references from other OK yards."],
  ['Cimarron Valley Cattle',    'Garden City',  'KS', '67846', 'Northeast',      'Doug Fisher',      'Feedlot Manager',   7250, "Big KS yard. Doug's seen every additive pitch there is. Bring independently published data or don't bother."],
  ['Sunbelt Cattle Co.',        'Dodge City',   'KS', '67801', 'Northeast',      'Nancy Reyes',      'Owner',             4400, "Nancy runs a lot of Holstein feeder cattle. Different performance profile, note that in any trial design."],
  ['Platte Valley Feeders',     'Lexington',    'NE', '68850', 'Northeast',      'Sam Peterson',     'Feedlot Manager',   5100, "NE corn country. Sam likes enzyme and energy products. Talks harvest prices constantly."],
  ['Western Slope Cattle',      'Billings',     'MT', '59101', 'Northwest',      'Travis Cole',      'Owner',             3800, "MT yard, long haul to market. Travis cares about finish weight and days on feed more than anything."],
  ['Bayou Land Cattle',         'Lake Charles', 'LA', '70601', 'Southeast',      'Renee Boudreaux',  'Feedlot Manager',   2650, "LA backgrounding operation. Heat stress is the real issue here, not gain. Different KPIs entirely."],
];

// ------------------------------------------------------------------
// 4. Products
// ------------------------------------------------------------------
const products = [
  ['BioGain DFM',     'Direct-Fed Microbial', 'Multi-strain direct-fed microbial (Bacillus subtilis, Enterococcus faecium, Lactobacillus plantarum) for gut health and feed efficiency in fed cattle.', 'g/head/day',  '10 g/head/day, top-dressed'],
  ['NutriGrow P',     'Amino Acid Supplement','Ruminally protected methionine and lysine to improve protein utilization in finishing rations.', 'g/head/day',  '25 g/head/day'],
  ['RumAide YC',      'Yeast Culture',        'Live yeast culture (Saccharomyces cerevisiae) to steady rumen pH and lift VFA production under high-grain diets.', 'ml/head/day', '15 ml/head/day via water'],
  ['ImmuGuard B',     'Immune Support',       'Beta-glucan and mannan-oligosaccharide blend to support immune function during receiving and weather stress.', 'g/head/day',  '5 g/head/day for 14 days post-receiving'],
  ['AcidPak',         'Rumen Acidifier',      'Buffered organic acid blend to moderate rumen pH dips during diet transitions and reduce sub-acute acidosis.', 'ml/head/day', '20 ml/head/day'],
  ['EnviroBind',      'Ammonia Mitigator',    'Clay-based binder that reduces pen ammonia and odor and marginally improves bedding dry matter.', 'lb/head/day', '0.5 lb/head/day'],
];

// ------------------------------------------------------------------
// 5. Trials
// ------------------------------------------------------------------
const trials = [
  [
    'BGN-ADG-23-01',
    'Average Daily Gain',
    1, 'BioGain DFM',
    1, 'Circle H Feeders',
    '2023-03-01', '2023-05-30', 90,
    'Hereford, TX',
    'completed',
    '400-head ADG pen trial, BioGain DFM vs control, mixed Angus/Hereford, started around 750 lb.'
  ],
  [
    'BGN-FCR-23-01',
    'Feed Conversion Ratio',
    1, 'BioGain DFM',
    1, 'Circle H Feeders',
    '2023-03-01', '2023-06-30', 121,
    'Hereford, TX',
    'completed',
    'Full finishing-cycle feed efficiency, pounds of feed per pound of live gain.'
  ],
  [
    'BGN-HLT-23-01',
    'Health & Mortality',
    1, 'BioGain DFM',
    1, 'Circle H Feeders',
    '2023-01-15', '2023-07-15', 181,
    'Hereford, TX',
    'completed',
    'Health outcome trial tracking morbidity, mortality, and treatment costs over roughly 6 months.'
  ],
  [
    'BGN-DMI-23-02',
    'Dry Matter Intake',
    1, 'BioGain DFM',
    2, 'Lone Star Feeders',
    '2023-04-01', '2023-07-01', 91,
    'Gainesville, TX',
    'completed',
    'DMI and rumen efficiency trial at Lone Star, with rumen sampling for VFA and pH.'
  ],
  [
    'RYA-DMI-23-01',
    'Dry Matter Intake',
    3, 'RumAide YC',
    3, 'High Plains Cattle Co.',
    '2023-05-10', '2023-08-08', 90,
    'Dalhart, TX',
    'completed',
    'RumAide YC DMI and rumen pH trial at High Plains Cattle Co.'
  ],
  [
    'NGP-ADG-23-01',
    'Average Daily Gain',
    2, 'NutriGrow P',
    4, 'Red River Cattle Co.',
    '2023-06-01', '2023-09-15', 106,
    'Borger, TX',
    'completed',
    'NutriGrow P amino acid trial measuring ADG and feed cost at Red River Cattle Co.'
  ],
  [
    'BGN-ADG-24-02',
    'Average Daily Gain',
    1, 'BioGain DFM',
    7, 'Amarillo Prime Feeders',
    '2024-02-15', '2024-05-20', 95,
    'Amarillo, TX',
    'completed',
    'Large-yard BioGain ADG trial, 500 head, corn-based finishing at Amarillo Prime.'
  ],
  [
    'IGB-MRB-24-01',
    'Receiving / Morbidity',
    4, 'ImmuGuard B',
    5, 'Panhandle Feedlot LLC',
    '2024-03-01', '2024-04-30', 60,
    'Pampa, TX',
    'completed',
    'Receiving-period morbidity trial with ImmuGuard B in fall-placed calves at Panhandle Feedlot LLC.'
  ],
  [
    'ACP-PH-24-01',
    'Rumen pH / Acidosis',
    5, 'AcidPak',
    12, 'Cimarron Valley Cattle',
    '2024-01-20', '2024-04-20', 90,
    'Garden City, KS',
    'completed',
    'AcidPak rumen pH and sub-acute acidosis trial in Holstein feeders at Cimarron Valley Cattle.'
  ],
  [
    'BGN-ADG-24-03',
    'Average Daily Gain',
    1, 'BioGain DFM',
    8, 'Kiamichi Cattle Co.',
    '2024-04-01', '2024-07-10', 100,
    'Guymon, OK',
    'completed',
    'BioGain ADG trial at Kiamichi Cattle Co., sorghum-based ration, OK panhandle.'
  ],
  [
    'RYA-DMI-24-02',
    'Dry Matter Intake',
    3, 'RumAide YC',
    14, 'Platte Valley Feeders',
    '2024-05-15', '2024-08-15', 92,
    'Lexington, NE',
    'in_progress',
    'RumAide YC DMI trial at Platte Valley Feeders. In progress, interim readings only.'
  ],
  [
    'ENB-AMM-24-01',
    'Ammonia / Odor',
    6, 'EnviroBind',
    16, 'Bayou Land Cattle',
    '2024-06-01', '2024-08-30', 90,
    'Lake Charles, LA',
    'planned',
    'EnviroBind ammonia and odor pen trial at Bayou Land Cattle. Planned, not yet started.'
  ],
];

// ------------------------------------------------------------------
// 6. Trial Results  (EAV metrics)
// ------------------------------------------------------------------
const trialResults = [
  // BGN-ADG-23-01
  [1, 'BGN-ADG-23-01', 'treatment', 'ADG',          3.11,  'lbs/day',          198, null,  'Pen average daily gain, treated pens'],
  [1, 'BGN-ADG-23-01', 'control',   'ADG',          2.79,  'lbs/day',          202, 0.004, 'Control pens; 2 head pulled mid-trial'],
  [1, 'BGN-ADG-23-01', 'treatment', 'FinalBW',      1283,  'lbs',              198, null,  'Average final shrunk weight'],
  [1, 'BGN-ADG-23-01', 'control',   'FinalBW',      1241,  'lbs',              202, 0.007, 'Control final weight'],
  [1, 'BGN-ADG-23-01', 'treatment', 'DaysOnFeed',   214,   'days',             198, null,  'Average days on feed'],
  [1, 'BGN-ADG-23-01', 'control',   'DaysOnFeed',   223,   'days',             202, 0.020, 'Control days on feed'],
  [1, 'BGN-ADG-23-01', 'treatment', 'ROI',          17.80, 'USD/head',         198, null,  'Net return after product cost'],

  // BGN-FCR-23-01
  [2, 'BGN-FCR-23-01', 'treatment', 'FCR',          5.94,  'lbs feed/lb gain', 198, null,  'Feed conversion ratio'],
  [2, 'BGN-FCR-23-01', 'control',   'FCR',          6.41,  'lbs feed/lb gain', 202, 0.001, 'Control FCR'],
  [2, 'BGN-FCR-23-01', 'treatment', 'FeedCost',     1.84,  'USD/lb gain',      198, null,  'Feed cost per lb of gain'],
  [2, 'BGN-FCR-23-01', 'control',   'FeedCost',     2.11,  'USD/lb gain',      202, 0.003, 'Control feed cost'],
  [2, 'BGN-FCR-23-01', 'treatment', 'CarcassYield', 63.2,  '%',                198, null,  'Hot carcass yield'],
  [2, 'BGN-FCR-23-01', 'control',   'CarcassYield', 62.7,  '%',                202, 0.180, 'No real difference (p=0.18)'],

  // BGN-HLT-23-01
  [3, 'BGN-HLT-23-01', 'treatment', 'Mortality',    1.6,   '%',                398, null,  'Total death loss'],
  [3, 'BGN-HLT-23-01', 'control',   'Mortality',    3.7,   '%',                402, 0.021, 'Control death loss'],
  [3, 'BGN-HLT-23-01', 'treatment', 'Morbidity',    8.4,   '%',                398, null,  'Treated morbidity (pulls)'],
  [3, 'BGN-HLT-23-01', 'control',   'Morbidity',    15.3,  '%',                402, 0.008, 'Control morbidity'],
  [3, 'BGN-HLT-23-01', 'treatment', 'TxCost',       29.10, 'USD/head',         398, null,  'Medication plus labor'],
  [3, 'BGN-HLT-23-01', 'control',   'TxCost',       51.40, 'USD/head',         402, 0.005, 'Control treatment cost'],
  [3, 'BGN-HLT-23-01', 'treatment', 'Pulls',        4.2,   '%',                398, null,  'Pulled for treatment'],
  [3, 'BGN-HLT-23-01', 'control',   'Pulls',        7.8,   '%',                402, 0.030, 'Control pulls'],

  // BGN-DMI-23-02
  [4, 'BGN-DMI-23-02', 'treatment', 'DMI',          13.9,  'lbs/day',          150, null,  'Dry matter intake'],
  [4, 'BGN-DMI-23-02', 'control',   'DMI',          13.2,  'lbs/day',          150, 0.040, 'Control DMI'],
  [4, 'BGN-DMI-23-02', 'treatment', 'RumenPH',      6.21,  'pH',               150, null,  'Average rumen pH'],
  [4, 'BGN-DMI-23-02', 'control',   'RumenPH',      6.02,  'pH',               150, 0.090, 'No sig diff (p=0.09)'],
  [4, 'BGN-DMI-23-02', 'treatment', 'VFA_Butyrate', 3.7,   'mM',               150, null,  'Butyrate concentration'],
  [4, 'BGN-DMI-23-02', 'control',   'VFA_Butyrate', 3.25,  'mM',               150, 0.110, 'No sig diff'],

  // RYA-DMI-23-01
  [5, 'RYA-DMI-23-01', 'treatment', 'DMI',          14.2,  'lbs/day',          120, null,  'Dry matter intake'],
  [5, 'RYA-DMI-23-01', 'control',   'DMI',          13.6,  'lbs/day',          120, 0.060, 'Borderline'],
  [5, 'RYA-DMI-23-01', 'treatment', 'RumenPH',      6.15,  'pH',               120, null,  'Average rumen pH'],
  [5, 'RYA-DMI-23-01', 'control',   'RumenPH',      5.98,  'pH',               120, 0.040, 'Control rumen pH'],
  [5, 'RYA-DMI-23-01', 'treatment', 'LacticAcid',   2.1,   'mM',               120, null,  'Rumen lactate'],
  [5, 'RYA-DMI-23-01', 'control',   'LacticAcid',   3.0,   'mM',               120, 0.020, 'Control lactate'],

  // NGP-ADG-23-01
  [6, 'NGP-ADG-23-01', 'treatment', 'ADG',          3.04,  'lbs/day',          180, null,  'Average daily gain'],
  [6, 'NGP-ADG-23-01', 'control',   'ADG',          2.83,  'lbs/day',          180, 0.030, 'Control ADG'],
  [6, 'NGP-ADG-23-01', 'treatment', 'FinalBW',      1255,  'lbs',              180, null,  'Final weight'],
  [6, 'NGP-ADG-23-01', 'control',   'FinalBW',      1228,  'lbs',              180, 0.050, 'Control final weight'],
  [6, 'NGP-ADG-23-01', 'treatment', 'FeedCost',     1.95,  'USD/lb gain',      180, null,  'Feed cost per lb gain'],
  [6, 'NGP-ADG-23-01', 'control',   'FeedCost',     2.08,  'USD/lb gain',      180, 0.090, 'No sig diff'],

  // BGN-ADG-24-02
  [7, 'BGN-ADG-24-02', 'treatment', 'ADG',          3.18,  'lbs/day',          250, null,  'Average daily gain'],
  [7, 'BGN-ADG-24-02', 'control',   'ADG',          2.94,  'lbs/day',          250, 0.002, 'Control ADG'],
  [7, 'BGN-ADG-24-02', 'treatment', 'DaysOnFeed',   208,   'days',             250, null,  'Days on feed'],
  [7, 'BGN-ADG-24-02', 'control',   'DaysOnFeed',   217,   'days',             250, 0.010, 'Control days on feed'],
  [7, 'BGN-ADG-24-02', 'treatment', 'HotCarcassWt', 845,   'lbs',              250, null,  'Hot carcass weight'],
  [7, 'BGN-ADG-24-02', 'control',   'HotCarcassWt', 822,   'lbs',              250, 0.020, 'Control HCW'],

  // IGB-MRB-24-01
  [8, 'IGB-MRB-24-01', 'treatment', 'BRDpulls',     6.3,   '%',                160, null,  'BRD pulls in receiving'],
  [8, 'IGB-MRB-24-01', 'control',   'BRDpulls',     12.1,  '%',                160, 0.006, 'Control BRD pulls'],
  [8, 'IGB-MRB-24-01', 'treatment', 'ADG',          2.9,   'lbs/day',          160, null,  'Receiving ADG'],
  [8, 'IGB-MRB-24-01', 'control',   'ADG',          2.6,   'lbs/day',          160, 0.040, 'Control receiving ADG'],
  [8, 'IGB-MRB-24-01', 'treatment', 'DeathLoss',    0.6,   '%',                160, null,  'Receiving death loss'],
  [8, 'IGB-MRB-24-01', 'control',   'DeathLoss',    1.4,   '%',                160, 0.120, 'No sig diff'],
  [8, 'IGB-MRB-24-01', 'treatment', 'MedCost',      14.20, 'USD/head',         160, null,  'Medication cost'],
  [8, 'IGB-MRB-24-01', 'control',   'MedCost',      27.80, 'USD/head',         160, 0.008, 'Control med cost'],

  // ACP-PH-24-01
  [9, 'ACP-PH-24-01', 'treatment', 'RumenPH',      6.18,  'pH',                140, null,  'Average rumen pH'],
  [9, 'ACP-PH-24-01', 'control',   'RumenPH',      5.95,  'pH',                140, 0.015, 'Control rumen pH'],
  [9, 'ACP-PH-24-01', 'treatment', 'DMI',          14.6,  'lbs/day',           140, null,  'Dry matter intake'],
  [9, 'ACP-PH-24-01', 'control',   'DMI',          14.1,  'lbs/day',           140, 0.080, 'No sig diff'],
  [9, 'ACP-PH-24-01', 'treatment', 'SARAevents',   1.2,   '%',                140, null,  'Sub-acute acidosis events'],
  [9, 'ACP-PH-24-01', 'control',   'SARAevents',   4.5,   '%',                140, 0.020, 'Control SARA events'],

  // BGN-ADG-24-03
  [10, 'BGN-ADG-24-03', 'treatment', 'ADG',        3.07,  'lbs/day',           210, null,  'Average daily gain'],
  [10, 'BGN-ADG-24-03', 'control',   'ADG',        2.80,  'lbs/day',           210, 0.003, 'Control ADG'],
  [10, 'BGN-ADG-24-03', 'treatment', 'FinalBW',    1268,  'lbs',               210, null,  'Final weight'],
  [10, 'BGN-ADG-24-03', 'control',   'FinalBW',    1235,  'lbs',               210, 0.009, 'Control final weight'],
  [10, 'BGN-ADG-24-03', 'treatment', 'ROI',        16.40, 'USD/head',          210, null,  'Net return'],

  // RYA-DMI-24-02 (interim, in progress)
  [11, 'RYA-DMI-24-02', 'treatment', 'DMI',        14.0,  'lbs/day',           100, null,  'Interim reading, week 6'],
  [11, 'RYA-DMI-24-02', 'control',   'DMI',        13.5,  'lbs/day',           100, 0.070, 'Interim, not yet sig'],
  [11, 'RYA-DMI-24-02', 'treatment', 'RumenPH',    6.12,  'pH',                100, null,  'Interim'],
];

// ------------------------------------------------------------------
// 7. Trial Parameters
// ------------------------------------------------------------------
const trialParameters = [
  // BGN-ADG-23-01
  [1, 'BGN-ADG-23-01', 'HerdSize',     '400', 'head', '198 treated + 202 control'],
  [1, 'BGN-ADG-23-01', 'Breed',        'Angus/Hereford cross', null, ''],
  [1, 'BGN-ADG-23-01', 'StartBW',      '748', 'lbs',  'Average arrival weight'],
  [1, 'BGN-ADG-23-01', 'Diet',         'Corn-based finishing', null, '~65% steam-flaked corn'],
  [1, 'BGN-ADG-23-01', 'Water',        'Ad libitum', null, ''],
  [1, 'BGN-ADG-23-01', 'Housing',      'Open dirt lot', null, ''],
  [1, 'BGN-ADG-23-01', 'AmbientTemp',  '72-94', 'F',    'Summer trial'],

  // BGN-FCR-23-01
  [2, 'BGN-FCR-23-01', 'HerdSize',     '400', 'head', ''],
  [2, 'BGN-FCR-23-01', 'Breed',        'Angus/Hereford cross', null, ''],
  [2, 'BGN-FCR-23-01', 'StartBW',      '748', 'lbs',  ''],
  [2, 'BGN-FCR-23-01', 'Diet',         'Corn-based finishing', null, 'Same pens as ADG trial'],
  [2, 'BGN-FCR-23-01', 'FeedType',     'TMR', null, 'Total mixed ration'],
  [2, 'BGN-FCR-23-01', 'FeedCost',     '288', 'USD/ton', 'Average during trial period'],

  // BGN-HLT-23-01
  [3, 'BGN-HLT-23-01', 'HerdSize',      '800', 'head', '398 treated + 402 control'],
  [3, 'BGN-HLT-23-01', 'Breed',         'Mixed', null, 'Mostly English cross'],
  [3, 'BGN-HLT-23-01', 'Vaccination',   'Standard', null, 'BRD, blackleg, IBR, BRSV per vet schedule'],
  [3, 'BGN-HLT-23-01', 'VetOversight',  'Bi-weekly', null, 'Dr. Linda Ruiz'],
  [3, 'BGN-HLT-23-01', 'RecordKeeping', 'CattleMax', null, 'Per-animal health records'],

  // BGN-DMI-23-02
  [4, 'BGN-DMI-23-02', 'HerdSize',      '300', 'head', '150 treated + 150 control'],
  [4, 'BGN-DMI-23-02', 'Breed',         'Angus', null, ''],
  [4, 'BGN-DMI-23-02', 'StartBW',       '715', 'lbs',  ''],
  [4, 'BGN-DMI-23-02', 'Diet',          'High-forage transition', null, 'Ramping to grain'],
  [4, 'BGN-DMI-23-02', 'RumenSampling', 'Bi-weekly', null, 'Liquor pulled for VFA'],

  // RYA-DMI-23-01
  [5, 'RYA-DMI-23-01', 'HerdSize',     '240', 'head', '120 treated + 120 control'],
  [5, 'RYA-DMI-23-01', 'Breed',        'Charolais cross', null, ''],
  [5, 'RYA-DMI-23-01', 'StartBW',      '730', 'lbs',  ''],
  [5, 'RYA-DMI-23-01', 'Diet',         '70% concentrate', null, ''],
  [5, 'RYA-DMI-23-01', 'YeastRate',    '15', 'ml/head/day', 'Per protocol'],

  // NGP-ADG-23-01
  [6, 'NGP-ADG-23-01', 'HerdSize',     '360', 'head', '180 treated + 180 control'],
  [6, 'NGP-ADG-23-01', 'Breed',        'Angus/Simmental', null, ''],
  [6, 'NGP-ADG-23-01', 'StartBW',      '755', 'lbs',  ''],
  [6, 'NGP-ADG-23-01', 'AminoRate',    '25', 'g/head/day', 'NutriGrow P dosing'],
  [6, 'NGP-ADG-23-01', 'Diet',         'Corn-based', null, ''],

  // BGN-ADG-24-02
  [7, 'BGN-ADG-24-02', 'HerdSize',     '500', 'head', '250 treated + 250 control'],
  [7, 'BGN-ADG-24-02', 'Breed',        'Angus/Hereford', null, ''],
  [7, 'BGN-ADG-24-02', 'StartBW',      '760', 'lbs',  ''],
  [7, 'BGN-ADG-24-02', 'Diet',         'Corn-based finishing', null, ''],
  [7, 'BGN-ADG-24-02', 'Housing',      'Confined pens', null, ''],

  // IGB-MRB-24-01
  [8, 'IGB-MRB-24-01', 'HerdSize',      '320', 'head', '160 treated + 160 control, receiving'],
  [8, 'IGB-MRB-24-01', 'Breed',         'British cross', null, ''],
  [8, 'IGB-MRB-24-01', 'ArrivalBW',     '525', 'lbs',  'Calves'],
  [8, 'IGB-MRB-24-01', 'Program',       '14-day receiving', null, 'ImmuGuard B days 0-14'],
  [8, 'IGB-MRB-24-01', 'VetOversight',  'Weekly', null, 'Dr. Karen Wells'],

  // ACP-PH-24-01
  [9, 'ACP-PH-24-01', 'HerdSize',       '280', 'head', '140 treated + 140 control'],
  [9, 'ACP-PH-24-01', 'Breed',          'Holstein steers', null, 'Dairy beef'],
  [9, 'ACP-PH-24-01', 'StartBW',        '640', 'lbs',  ''],
  [9, 'ACP-PH-24-01', 'AcidifierRate',  '20', 'ml/head/day', 'AcidPak dosing'],
  [9, 'ACP-PH-24-01', 'Diet',           'High-grain', null, 'Transition stress'],

  // BGN-ADG-24-03
  [10, 'BGN-ADG-24-03', 'HerdSize',    '420', 'head', '210 treated + 210 control'],
  [10, 'BGN-ADG-24-03', 'Breed',       'Angus/Hereford', null, ''],
  [10, 'BGN-ADG-24-03', 'StartBW',     '742', 'lbs',  ''],
  [10, 'BGN-ADG-24-03', 'Diet',        'Sorghum-based', null, 'OK region'],

  // RYA-DMI-24-02 (partial)
  [11, 'RYA-DMI-24-02', 'HerdSize',    '200', 'head', '100 in so far (planned 400)'],
  [11, 'RYA-DMI-24-02', 'Breed',       'Angus', null, ''],
  [11, 'RYA-DMI-24-02', 'StartBW',     '720', 'lbs',  ''],
];

// ------------------------------------------------------------------
// 8. Publications
// ------------------------------------------------------------------
const publications = [
  [
    'Effect of a multi-strain direct-fed microbial on growth and carcass traits in finishing beef steers',
    'M.A. Brown, J.R. Smith, T.K. Johnson',
    'Journal of Animal Science',
    2021, '99(8)', '1-10',
    '10.1093/jas/skab245',
    'https://doi.org/10.1093/jas/skab245',
    'Twelve-trial summary showing DFM improved ADG by about 0.22 lb/day and lifted carcass yield in finishing steers.',
    'Backs the ADG and yield results in BGN-ADG trials 23-01 and 24-02 / 24-03.'
  ],
  [
    'Rumen fermentation response to Enterococcus faecium in beef cattle',
    'L.M. Garcia, D.P. Wilson, R. Okafor',
    'Livestock Science',
    2020, '240', '104215',
    '10.1016/j.livsci.2020.104215',
    'https://doi.org/10.1016/j.livsci.2020.104215',
    'E. faecium shifted fermentation toward butyrate and steadied pH under high-grain feeding.',
    'Explains the rumen pH and butyrate findings in the DMI trials.'
  ],
  [
    'Field experience with DFM in commercial feedlots: morbidity and mortality across five sites',
    'C. Rodriguez, S. Patel',
    'The Professional Animal Scientist',
    2022, '38(4)', '312-319',
    '10.15232/aas.2022-02231',
    'https://doi.org/10.15232/aas.2022-02231',
    'Multi-site field data showing roughly 45% lower morbidity and 55% lower mortality with DFM use.',
    'Corroborates the BGN-HLT-23-01 health outcomes with independent data.'
  ],
  [
    'Yeast culture and rumen pH stability during high-grain finishing',
    'N. Yamamoto, F. Dubois',
    'Animal Feed Science and Technology',
    2019, '257', '114281',
    '10.1016/j.anifeedsci.2019.114281',
    'https://doi.org/10.1016/j.anifeedsci.2019.114281',
    'Live yeast moderated pH dips and lowered lactate during the grain ramp.',
    'Supports the RYA-DMI rumen findings.'
  ],
  [
    'Economics of feed additive use in Texas Panhandle feedlots',
    'R. Anderson, K. Liu, J. Webb',
    'Applied Animal Science',
    2023, '39(2)', '145-153',
    '10.1093/jas/tyad042',
    'https://doi.org/10.1093/jas/tyad042',
    'Net ROI of $12-22 per head across eight yards, with payback strongest on ADG.',
    'Benchmark for the ROI figures in the BGN-ADG trials.'
  ],
  [
    'Receiving program outcomes with immune modulators - Oklahoma cooperating feedlots',
    'Rangeland Nutrition Technical Team',
    'Rangeland Nutrition Technical Report',
    2024, 'TR-2024-03', 'n/a',
    null,
    null,
    'Internal summary of four Oklahoma yards using ImmuGuard B at receiving; lower BRD pulls were consistent.',
    'Direct support for IGB-MRB-24-01.'
  ],
  [
    'Reducing antibiotic use in feedlots: a review',
    'J. Mitchell, P. Sullivan, H. Nakamura',
    'Veterinary Research Communications',
    2024, '48', '1-14',
    '10.1007/s11259-024-00328-2',
    'https://doi.org/10.1007/s11259-024-00328-2',
    'Review concluding DFM and immune modulators can cut antibiotic reliance by 35-50% while holding performance.',
    'Supports the antibiotic-reduction and withdrawal claims.'
  ],
];

// ------------------------------------------------------------------
// 9. Trial References (N-M link)
// ------------------------------------------------------------------
const trialReferences = [
  [1, 'BGN-ADG-23-01', 1, 'Effect of a multi-strain DFM on growth and carcass traits', 'Supports the 11.5% ADG lift observed.'],
  [1, 'BGN-ADG-23-01', 5, 'Economics of feed additive use', 'ROI benchmark for the cost conversation.'],
  [2, 'BGN-FCR-23-01', 1, 'Effect of a multi-strain DFM on growth and carcass traits', 'FCR drop lines up with the published 4-5%.'],
  [2, 'BGN-FCR-23-01', 5, 'Economics of feed additive use', 'Feed-cost savings context.'],
  [3, 'BGN-HLT-23-01', 3, 'Field experience with DFM in commercial feedlots', 'Independent morbidity cut matches ours.'],
  [3, 'BGN-HLT-23-01', 7, 'Reducing antibiotic use in feedlots', 'Supports the withdrawal reduction.'],
  [4, 'BGN-DMI-23-02', 2, 'Rumen fermentation response to Enterococcus faecium', 'Mechanism for the pH and butyrate shift.'],
  [5, 'RYA-DMI-23-01', 4, 'Yeast culture and rumen pH stability', 'Yeast mechanism for pH and lactate.'],
  [5, 'RYA-DMI-23-01', 2, 'Rumen fermentation response to Enterococcus faecium', 'Cross-check on butyrate.'],
  [6, 'NGP-ADG-23-01', 1, 'Effect of a multi-strain DFM on growth and carcass traits', 'ADG support in an amino-acid context.'],
  [7, 'BGN-ADG-24-02', 1, 'Effect of a multi-strain DFM on growth and carcass traits', 'Large-yard confirmation.'],
  [7, 'BGN-ADG-24-02', 5, 'Economics of feed additive use', 'ROI at scale.'],
  [8, 'IGB-MRB-24-01', 6, 'Receiving program outcomes with immune modulators', 'Direct internal support.'],
  [8, 'IGB-MRB-24-01', 7, 'Reducing antibiotic use in feedlots', 'Antibiotic-reduction angle.'],
  [9, 'ACP-PH-24-01', 4, 'Yeast culture and rumen pH stability', 'Acidosis mechanism.'],
  [10, 'BGN-ADG-24-03', 1, 'Effect of a multi-strain DFM on growth and carcass traits', 'OK-region confirmation.'],
  [10, 'BGN-ADG-24-03', 5, 'Economics of feed additive use', 'ROI benchmark.'],
  [11, 'RYA-DMI-24-02', 4, 'Yeast culture and rumen pH stability', 'Pending final data.'],
  [11, 'RYA-DMI-24-02', 2, 'Rumen fermentation response to Enterococcus faecium', 'Pending final data.'],
];

// ------------------------------------------------------------------
// 10. Customer Visits
// ------------------------------------------------------------------
const customerVisits = [
  [1, 'Mike Torres', 1, 'Circle H Feeders', '2023-02-10',
   'Initial consult',
   "Met Tom. He's run a pen on DFM since '21 and wants a proper trial before a full-yard switch."],
  [1, 'Mike Torres', 1, 'Circle H Feeders', '2023-03-15',
   'Trial kickoff',
   'Walked pens with Tom and Dr. Ruiz. Set up treated/control split, 400 head total.'],
  [1, 'Mike Torres', 1, 'Circle H Feeders', '2023-06-12',
   'Interim review',
   "Halfway through. Tom says the treated pens look cleaner. Still wants final numbers in hand."],
  [1, 'Mike Torres', 1, 'Circle H Feeders', '2023-08-24',
   'Results',
   'Presented ADG/FCR/health. Tom impressed with the mortality drop. Likely full-yard next fall.'],
  [1, 'Mike Torres', 2, 'Lone Star Feeders', '2023-03-20',
   'Trial setup',
   "James wanted DMI focus, not just ADG. Agreed to rumen sampling on top of the standard panel."],
  [1, 'Mike Torres', 2, 'Lone Star Feeders', '2023-07-25',
   'Results',
   "James liked the FCR number. Pushed back on cost until I showed the feed-cost-per-lb line."],
  [2, 'Sarah Chen', 6, 'Canyon View Beef', '2023-04-05',
   'Prospect',
   "Rick's a small yard. He walks pens daily and noticed our samples improved coat condition. Warm to a trial."],
  [2, 'Sarah Chen', 6, 'Canyon View Beef', '2023-09-18',
   'Follow-up',
   "Rick wants ImmuGuard B at receiving on the next group. Small account but loyal."],
  [2, 'Sarah Chen', 7, 'Amarillo Prime Feeders', '2023-11-14',
   'Account review',
   "Patricia's nutritionist was skeptical. Needed published data, so I sent Brown 2021 and Anderson 2023."],
  [2, 'Sarah Chen', 7, 'Amarillo Prime Feeders', '2024-02-10',
   'Trial approval',
   'After three months of paperwork the trial was approved for 500 head. Starts Feb 15.'],
  [2, 'Sarah Chen', 7, 'Amarillo Prime Feeders', '2024-06-03',
   'Results',
   'Big yard, clean result. Patricia is forwarding it to their nutritionist committee.'],
  [3, 'David Patterson', 8, 'Kiamichi Cattle Co.', '2024-03-05',
   'Prospect',
   "Pat watches feed cost per ton. Led with FCR and ROI, not ADG, and that hooked him."],
  [3, 'David Patterson', 8, 'Kiamichi Cattle Co.', '2024-04-01',
   'Trial kickoff',
   '420 head, sorghum-based ration. Pat wanted OK references, so I gave him the Canadian River name.'],
  [3, 'David Patterson', 8, 'Kiamichi Cattle Co.', '2024-07-22',
   'Results',
   'Solid ADG lift. Pat is happy and mentioned possibly dropping his current competitor DFM.'],
  [3, 'David Patterson', 9, 'Beaver County Feeders', '2023-05-30',
   'Prospect',
   "Mark's been at this 30 years and trusts his gut. Didn't push product, just left samples and data."],
  [3, 'David Patterson', 9, 'Beaver County Feeders', '2024-01-19',
   'Follow-up',
   'Mark called. A neighbor yard saw good results, so now he is interested. Rapport is paying off.'],
  [8, 'Kelly Ortiz', 10, 'Cimarron Feeders', '2023-07-11',
   'Prospect',
   "Angela (the nutritionist) wants NPN and label detail on NutriGrow P. Sent the spec sheet the same day."],
  [8, 'Kelly Ortiz', 10, 'Cimarron Feeders', '2023-09-02',
   'Trial setup',
   'Agreed to an amino-acid trial, 360 head. Angela is driving it internally.'],
  [8, 'Kelly Ortiz', 11, 'Canadian River Feeders', '2024-02-22',
   'Account review',
   "Greg expanded in '22. Wants OK-yard references before any program. Connected him with Kiamichi."],
  [4, 'Jennifer Hayes', 12, 'Cimarron Valley Cattle', '2024-01-08',
   'Prospect',
   "Doug's seen every pitch. His Holstein feeders are a different profile, so I focused on acidosis, not gain."],
  [4, 'Jennifer Hayes', 12, 'Cimarron Valley Cattle', '2024-04-25',
   'Results',
   'AcidPak cut SARA events. Doug is cautiously positive and wants a second pen before committing.'],
  [4, 'Jennifer Hayes', 13, 'Sunbelt Cattle Co.', '2024-03-18',
   'Prospect',
   "Nancy runs Holstein feeders. The performance profile differs, so I noted that in the trial design."],
  [5, 'Robert Kim', 14, 'Platte Valley Feeders', '2024-05-10',
   'Trial kickoff',
   "Sam likes enzyme and energy products. RumAide DMI trial, 400 planned, 200 in so far."],
  [5, 'Robert Kim', 14, 'Platte Valley Feeders', '2024-07-30',
   'Interim',
   'Week 6 interim. pH is trending up in the treated pens. Sam wants final numbers before committing.'],
  [6, 'Amanda Reed', 16, 'Bayou Land Cattle', '2024-05-20',
   'Prospect',
   "Renee's LA backgrounding yard. Heat stress is the real issue, not gain. Pitched EnviroBind for ammonia."],
  [6, 'Amanda Reed', 16, 'Bayou Land Cattle', '2024-06-01',
   'Trial setup',
   'EnviroBind pen trial planned, 90 days. Still pending, no data yet.'],
  [7, 'Thomas Becker', 15, 'Western Slope Cattle', '2024-04-12',
   'Account review',
   'Travis cares about finish weight and days on feed given the long haul to market. Discussed BioGain.'],
];

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  await client.connect();
  console.log('Connected to database.');

  // --- DDL: drop and recreate tables ---
  await client.query(`DROP TABLE IF EXISTS trial_references  CASCADE`);
  await client.query(`DROP TABLE IF EXISTS trial_results     CASCADE`);
  await client.query(`DROP TABLE IF EXISTS trial_parameters  CASCADE`);
  await client.query(`DROP TABLE IF EXISTS trials            CASCADE`);
  await client.query(`DROP TABLE IF EXISTS customer_visits   CASCADE`);
  await client.query(`DROP TABLE IF EXISTS publications      CASCADE`);
  await client.query(`DROP TABLE IF EXISTS products          CASCADE`);
  await client.query(`DROP TABLE IF EXISTS customers         CASCADE`);
  await client.query(`DROP TABLE IF EXISTS sales_reps        CASCADE`);
  await client.query(`DROP TABLE IF EXISTS regions           CASCADE`);

  await client.query(`CREATE TABLE regions (
    id    INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE,
    code  TEXT,
    desc  TEXT
  )`);

  await client.query(`CREATE TABLE sales_reps (
    id           INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    region_id    INT NOT NULL,
    region       TEXT NOT NULL,
    territory    TEXT
  )`);

  await client.query(`CREATE TABLE customers (
    id            INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL,
    city          TEXT NOT NULL,
    state         TEXT NOT NULL,
    zip           TEXT,
    region        TEXT NOT NULL,
    contact_name  TEXT,
    contact_title TEXT,
    head_count    INT,
    notes         TEXT
  )`);

  await client.query(`CREATE TABLE products (
    id           INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    description  TEXT,
    dosage_unit  TEXT,
    dosage_rate  TEXT
  )`);

  await client.query(`CREATE TABLE trials (
    id              INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    trial_name      TEXT NOT NULL,
    trial_type      TEXT NOT NULL,
    product_id      INT NOT NULL,
    product_name    TEXT NOT NULL,
    customer_id     INT NOT NULL,
    customer_name   TEXT NOT NULL,
    start_date      TEXT NOT NULL,
    end_date        TEXT,
    duration_days   INT,
    location        TEXT,
    status          TEXT NOT NULL,
    description     TEXT
  )`);

  await client.query(`CREATE TABLE trial_results (
    id               INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    trial_id         INT NOT NULL,
    trial_name       TEXT NOT NULL,
    group_type       TEXT NOT NULL,
    metric_name      TEXT NOT NULL,
    metric_value     DOUBLE PRECISION NOT NULL,
    unit             TEXT,
    sample_size      INT,
    p_value          DOUBLE PRECISION,
    notes            TEXT
  )`);

  await client.query(`CREATE TABLE trial_parameters (
    id           INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    trial_id     INT NOT NULL,
    trial_name   TEXT NOT NULL,
    param_name   TEXT NOT NULL,
    param_value  TEXT NOT NULL,
    unit         TEXT,
    notes        TEXT
  )`);

  await client.query(`CREATE TABLE publications (
    id          INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title       TEXT NOT NULL,
    authors     TEXT,
    journal     TEXT,
    year        INT,
    volume      TEXT,
    pages       TEXT,
    doi         TEXT,
    url         TEXT,
    summary     TEXT,
    relevance   TEXT
  )`);

  await client.query(`CREATE TABLE trial_references (
    id                INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    trial_id          INT NOT NULL,
    trial_name        TEXT NOT NULL,
    publication_id    INT NOT NULL,
    publication_title TEXT NOT NULL,
    citation_note     TEXT
  )`);

  await client.query(`CREATE TABLE customer_visits (
    id            INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    rep_id        INT NOT NULL,
    rep_name      TEXT NOT NULL,
    customer_id   INT NOT NULL,
    customer_name TEXT NOT NULL,
    visit_date    TEXT NOT NULL,
    purpose       TEXT,
    notes         TEXT
  )`);

  // Indexes
  await client.query('CREATE INDEX idx_trials_product       ON trials(product_name)');
  await client.query('CREATE INDEX idx_trials_customer      ON trials(customer_name)');
  await client.query('CREATE INDEX idx_trials_type          ON trials(trial_type)');
  await client.query('CREATE INDEX idx_trials_status        ON trials(status)');
  await client.query('CREATE INDEX idx_trials_start_date    ON trials(start_date)');
  await client.query('CREATE INDEX idx_trial_results_trial  ON trial_results(trial_id)');
  await client.query('CREATE INDEX idx_trial_results_metric ON trial_results(metric_name)');
  await client.query('CREATE INDEX idx_trial_results_group  ON trial_results(group_type)');
  await client.query('CREATE INDEX idx_trial_params_trial   ON trial_parameters(trial_id)');
  await client.query('CREATE INDEX idx_trial_refs_trial     ON trial_references(trial_id)');
  await client.query('CREATE INDEX idx_trial_refs_pub       ON trial_references(publication_id)');
  await client.query('CREATE INDEX idx_customers_city       ON customers(city)');
  await client.query('CREATE INDEX idx_customers_state      ON customers(state)');
  await client.query('CREATE INDEX idx_visits_customer      ON customer_visits(customer_name)');
  await client.query('CREATE INDEX idx_visits_rep           ON customer_visits(rep_name)');

  console.log('Tables and indexes created.');

  // --- Seed data (batched with BEGIN/COMMIT) ---

  await client.query('BEGIN');
  for (const r of regions)      await client.query(insertRegion, r);
  await client.query('COMMIT');
  console.log(`Inserted ${regions.length} regions.`);

  await client.query('BEGIN');
  for (const s of salesReps)    await client.query(insertSalesRep, s);
  await client.query('COMMIT');
  console.log(`Inserted ${salesReps.length} sales reps.`);

  await client.query('BEGIN');
  for (const c of customers)    await client.query(insertCustomer, c);
  await client.query('COMMIT');
  console.log(`Inserted ${customers.length} customers.`);

  await client.query('BEGIN');
  for (const p of products)     await client.query(insertProduct, p);
  await client.query('COMMIT');
  console.log(`Inserted ${products.length} products.`);

  await client.query('BEGIN');
  for (const t of trials)       await client.query(insertTrial, t);
  await client.query('COMMIT');
  console.log(`Inserted ${trials.length} trials.`);

  await client.query('BEGIN');
  for (const r of trialResults) await client.query(insertResult, r);
  await client.query('COMMIT');
  console.log(`Inserted ${trialResults.length} trial results.`);

  await client.query('BEGIN');
  for (const p of trialParameters) await client.query(insertParam, p);
  await client.query('COMMIT');
  console.log(`Inserted ${trialParameters.length} trial parameters.`);

  await client.query('BEGIN');
  for (const pub of publications) await client.query(insertPublication, pub);
  await client.query('COMMIT');
  console.log(`Inserted ${publications.length} publications.`);

  await client.query('BEGIN');
  for (const ref of trialReferences) await client.query(insertRef, ref);
  await client.query('COMMIT');
  console.log(`Inserted ${trialReferences.length} trial references.`);

  await client.query('BEGIN');
  for (const v of customerVisits) await client.query(insertVisit, v);
  await client.query('COMMIT');
  console.log(`Inserted ${customerVisits.length} customer visits.`);

  // --- Summary ---
  const counts = await client.query(`
    SELECT 'regions' AS tbl, COUNT(*) AS cnt FROM regions
    UNION ALL SELECT 'sales_reps', COUNT(*) FROM sales_reps
    UNION ALL SELECT 'customers', COUNT(*) FROM customers
    UNION ALL SELECT 'products', COUNT(*) FROM products
    UNION ALL SELECT 'trials', COUNT(*) FROM trials
    UNION ALL SELECT 'trial_results', COUNT(*) FROM trial_results
    UNION ALL SELECT 'trial_parameters', COUNT(*) FROM trial_parameters
    UNION ALL SELECT 'publications', COUNT(*) FROM publications
    UNION ALL SELECT 'trial_references', COUNT(*) FROM trial_references
    UNION ALL SELECT 'customer_visits', COUNT(*) FROM customer_visits
  `);

  console.log('\n=== Database Initialization Complete ===');
  for (const row of counts.rows) {
    console.log(`  ${row.tbl.padEnd(20)} : ${row.cnt}`);
  }
  console.log('');

  await client.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Initialization failed:', err);
  process.exit(1);
});
