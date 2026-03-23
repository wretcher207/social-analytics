// ── Cultivar types ────────────────────────────────────────────────────────────
export const CULTIVAR_TYPES = [
  { value: 'indica',   label: 'Indica' },
  { value: 'sativa',   label: 'Sativa' },
  { value: 'hybrid',   label: 'Hybrid' },
  { value: 'cbd',      label: 'High CBD' },
  { value: 'unknown',  label: 'Unknown' },
]

// ── Product categories ────────────────────────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  { value: 'flower',      label: 'Flower' },
  { value: 'concentrate', label: 'Concentrate' },
  { value: 'edible',      label: 'Edible' },
  { value: 'vape',        label: 'Vape' },
  { value: 'tincture',    label: 'Tincture' },
  { value: 'topical',     label: 'Topical' },
  { value: 'other',       label: 'Other' },
]

export const CONCENTRATE_SUBCATEGORIES = [
  { value: 'live_resin',  label: 'Live Resin' },
  { value: 'live_rosin',  label: 'Live Rosin' },
  { value: 'rosin',       label: 'Rosin' },
  { value: 'wax',         label: 'Wax' },
  { value: 'shatter',     label: 'Shatter' },
  { value: 'badder',      label: 'Badder / Batter' },
  { value: 'sugar',       label: 'Sugar' },
  { value: 'diamonds',    label: 'Diamonds' },
  { value: 'sauce',       label: 'Sauce' },
  { value: 'hash',        label: 'Hash' },
  { value: 'distillate',  label: 'Distillate' },
  { value: 'rso',         label: 'RSO' },
  { value: 'other',       label: 'Other' },
]

// ── Consumption methods ───────────────────────────────────────────────────────
export const CONSUMPTION_METHODS = [
  { value: 'flower',      label: 'Flower' },
  { value: 'dab',         label: 'Dab' },
  { value: 'vape',        label: 'Vape' },
  { value: 'edible',      label: 'Edible' },
  { value: 'tincture',    label: 'Tincture' },
  { value: 'sublingual',  label: 'Sublingual' },
  { value: 'topical',     label: 'Topical' },
  { value: 'other',       label: 'Other' },
]

// ── Effect tags ───────────────────────────────────────────────────────────────
export const EFFECT_TAGS = [
  'relaxed', 'euphoric', 'creative', 'focused', 'energetic',
  'uplifted', 'happy', 'giggly', 'talkative', 'sociable',
  'sleepy', 'sedated', 'body-heavy', 'couch-lock',
  'pain relief', 'anti-anxiety', 'appetite', 'anti-nausea',
  'clear-headed', 'meditative',
]

export const NEGATIVE_TAGS = [
  'dry mouth', 'dry eyes', 'anxiety', 'paranoia',
  'headache', 'dizziness', 'racing thoughts', 'fatigue',
  'couch-lock', 'over-intoxicated',
]

// ── Primary terpenes (for pickers) ────────────────────────────────────────────
export const TERPENES = [
  { name: 'Myrcene',        note: 'Earthy, musky, herbal. Sedating, anti-inflammatory.' },
  { name: 'Limonene',       note: 'Citrus, lemon. Uplifting, anti-anxiety.' },
  { name: 'Caryophyllene',  note: 'Pepper, spice. Anti-inflammatory, CB2 agonist.' },
  { name: 'Linalool',       note: 'Floral, lavender. Calming, anxiolytic.' },
  { name: 'Pinene',         note: 'Pine, fresh. Alertness, bronchodilator.' },
  { name: 'Humulene',       note: 'Earthy, hoppy. Appetite suppressant, anti-inflammatory.' },
  { name: 'Terpinolene',    note: 'Floral, piney, herbal. Mildly sedating, antioxidant.' },
  { name: 'Ocimene',        note: 'Sweet, herbal, woody. Uplifting, antifungal.' },
  { name: 'Bisabolol',      note: 'Floral, chamomile. Soothing, anti-irritant.' },
  { name: 'Valencene',      note: 'Sweet citrus, orange. Uplifting.' },
  { name: 'Geraniol',       note: 'Rose, floral. Neuroprotective, antifungal.' },
  { name: 'Camphene',       note: 'Earthy, woody. Antioxidant.' },
]

// ── Rating scale label ─────────────────────────────────────────────────────────
export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
}
