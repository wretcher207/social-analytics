-- =============================================================================
-- TERP — Seed Data
-- Run after migrations. Populates global reference strains.
-- user_id = NULL means globally visible to all authenticated users.
-- =============================================================================

insert into strains (
  name, brand, cultivar_type,
  thc_pct, cbd_pct, terpenes,
  lineage, description
) values

-- ── Classics ──────────────────────────────────────────────────────────────────

(
  'OG Kush', null, 'hybrid',
  23.00, 0.10,
  '[
    {"name":"Myrcene","pct":0.38},
    {"name":"Limonene","pct":0.28},
    {"name":"Caryophyllene","pct":0.19},
    {"name":"Linalool","pct":0.08}
  ]'::jsonb,
  'Chemdawg × (Hindu Kush × Lemon Thai)',
  'The archetypal West Coast hybrid. Fuel, earth, and citrus with a heavy, euphoric body effect.'
),

(
  'Blue Dream', null, 'sativa',
  21.00, 0.20,
  '[
    {"name":"Myrcene","pct":0.41},
    {"name":"Caryophyllene","pct":0.22},
    {"name":"Pinene","pct":0.14},
    {"name":"Ocimene","pct":0.07}
  ]'::jsonb,
  'Blueberry × Haze',
  'A California staple. Sweet berry aroma layered over floral haze. Balanced full-body relaxation with gentle cerebral invigoration.'
),

(
  'Sour Diesel', null, 'sativa',
  22.00, 0.10,
  '[
    {"name":"Caryophyllene","pct":0.34},
    {"name":"Myrcene","pct":0.26},
    {"name":"Limonene","pct":0.22},
    {"name":"Terpinolene","pct":0.11}
  ]'::jsonb,
  'Chemdawg 91 × Super Skunk (disputed)',
  'Diesel fuel, skunk, and citrus rind. Fast-acting cerebral rush. A functional daytime strain with cult status.'
),

(
  'Girl Scout Cookies', null, 'hybrid',
  25.00, 0.10,
  '[
    {"name":"Caryophyllene","pct":0.42},
    {"name":"Limonene","pct":0.21},
    {"name":"Humulene","pct":0.14},
    {"name":"Linalool","pct":0.10}
  ]'::jsonb,
  'OG Kush × Durban Poison',
  'Sweet, earthy, and pungent with notes of mint and cherry. Strong euphoria with full-body relaxation.'
),

(
  'Gelato', null, 'hybrid',
  26.00, 0.08,
  '[
    {"name":"Caryophyllene","pct":0.38},
    {"name":"Limonene","pct":0.32},
    {"name":"Myrcene","pct":0.17},
    {"name":"Linalool","pct":0.09}
  ]'::jsonb,
  'Sunset Sherbet × Thin Mint GSC',
  'Dessert-forward — sweet cream, citrus, and lavender. Potent hybrid that leans euphoric without heavy sedation.'
),

(
  'Wedding Cake', null, 'hybrid',
  25.00, 0.08,
  '[
    {"name":"Caryophyllene","pct":0.44},
    {"name":"Limonene","pct":0.26},
    {"name":"Myrcene","pct":0.18},
    {"name":"Humulene","pct":0.08}
  ]'::jsonb,
  'Triangle Kush × Animal Mints',
  'Rich vanilla and earthy pepper. Dense, resinous flower. Relaxing and euphoric — excellent for stress and appetite.'
),

(
  'White Widow', null, 'hybrid',
  20.00, 0.15,
  '[
    {"name":"Myrcene","pct":0.29},
    {"name":"Caryophyllene","pct":0.25},
    {"name":"Pinene","pct":0.21},
    {"name":"Limonene","pct":0.12}
  ]'::jsonb,
  'Brazilian Sativa × South Indian Indica',
  'Legendary Dutch classic. Earthy, woody, and slightly sweet. Energetic burst of euphoria that levels into relaxation.'
),

(
  'Gorilla Glue #4', null, 'hybrid',
  28.00, 0.10,
  '[
    {"name":"Caryophyllene","pct":0.39},
    {"name":"Myrcene","pct":0.33},
    {"name":"Limonene","pct":0.16},
    {"name":"Humulene","pct":0.10}
  ]'::jsonb,
  'Chem''s Sister × Sour Dubb × Chocolate Diesel',
  'Earthy, piney, and pungent with notes of diesel and chocolate. Heavy, full-body effect — couch-lock territory at high doses.'
),

-- ── Connoisseur / Modern ──────────────────────────────────────────────────────

(
  'Runtz', null, 'hybrid',
  27.00, 0.07,
  '[
    {"name":"Caryophyllene","pct":0.36},
    {"name":"Limonene","pct":0.29},
    {"name":"Linalool","pct":0.18},
    {"name":"Myrcene","pct":0.12}
  ]'::jsonb,
  'Zkittlez × Gelato',
  'Tropical candy sweetness backed by creamy citrus. Smooth smoke, long-lasting balanced high.'
),

(
  'Zkittlez', null, 'indica',
  23.00, 0.30,
  '[
    {"name":"Caryophyllene","pct":0.31},
    {"name":"Humulene","pct":0.25},
    {"name":"Linalool","pct":0.20},
    {"name":"Myrcene","pct":0.15}
  ]'::jsonb,
  'Grape Ape × Grapefruit × unknown indica',
  'Vivid tropical fruit and candy sweetness. Award-winning indica with full-body calm and uplifted mood.'
),

(
  'Papaya Cake', null, 'indica',
  24.00, 0.09,
  '[
    {"name":"Myrcene","pct":0.45},
    {"name":"Caryophyllene","pct":0.28},
    {"name":"Limonene","pct":0.15},
    {"name":"Ocimene","pct":0.08}
  ]'::jsonb,
  'Papaya × Wedding Cake',
  'Ripe tropical fruit with creamy vanilla undertones. Heavy indica leaning — excellent for sleep and pain management.'
),

(
  'MAC 1', null, 'hybrid',
  23.00, 0.12,
  '[
    {"name":"Limonene","pct":0.33},
    {"name":"Caryophyllene","pct":0.28},
    {"name":"Myrcene","pct":0.22},
    {"name":"Ocimene","pct":0.09}
  ]'::jsonb,
  'Miracle Alien Cookies × Columbian × Starfighter',
  'Diesel and citrus bloom with floral candy sweetness. Well-rounded potency — clear, functional euphoria.'
),

(
  'Mimosa', null, 'sativa',
  19.00, 0.10,
  '[
    {"name":"Limonene","pct":0.45},
    {"name":"Ocimene","pct":0.22},
    {"name":"Myrcene","pct":0.16},
    {"name":"Caryophyllene","pct":0.10}
  ]'::jsonb,
  'Clementine × Purple Punch',
  'Citrus fruit and floral brightness. Uplifting and social — the morning strain.'
),

(
  'Ice Cream Cake', null, 'indica',
  25.00, 0.08,
  '[
    {"name":"Caryophyllene","pct":0.40},
    {"name":"Linalool","pct":0.28},
    {"name":"Limonene","pct":0.18},
    {"name":"Myrcene","pct":0.11}
  ]'::jsonb,
  'Wedding Cake × Gelato #33',
  'Vanilla cream and sweet dough. Deeply relaxing — well suited for evening pain and anxiety relief.'
),

-- ── High CBD ──────────────────────────────────────────────────────────────────

(
  'ACDC', null, 'cbd',
  1.00, 20.00,
  '[
    {"name":"Myrcene","pct":0.30},
    {"name":"Pinene","pct":0.22},
    {"name":"Caryophyllene","pct":0.18},
    {"name":"Terpinolene","pct":0.12}
  ]'::jsonb,
  'Cannatonic phenotype',
  'Near-zero THC, high CBD. Earthy and woody. Non-intoxicating relief for anxiety, pain, and inflammation.'
),

(
  'Harlequin', null, 'cbd',
  7.00, 12.00,
  '[
    {"name":"Myrcene","pct":0.35},
    {"name":"Pinene","pct":0.25},
    {"name":"Caryophyllene","pct":0.20},
    {"name":"Ocimene","pct":0.09}
  ]'::jsonb,
  'Colombian Gold × Thai × Swiss × Nepali indica',
  'Mango and earthy sweetness. High CBD:THC ratio delivers clear-headed relief without significant intoxication.'
);
