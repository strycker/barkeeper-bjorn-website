// Schema normalization — coerces data files to canonical shape on load and import.
// Prevents corruption from malformed imports, legacy field drift, or partial writes.
// Each normalizer is idempotent: running it twice yields the same result.

const Normalize = (() => {

  function ensureObject(v)  { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
  function ensureArray(v)   { return Array.isArray(v) ? v : []; }
  function ensureString(v)  { return typeof v === 'string' ? v : ''; }
  function isoToday()       { return new Date().toISOString().slice(0, 10); }

  // Allowed top-level keys for inventory.json (per schema/inventory.schema.json + Phase 2 unassigned).
  // Anything else is a legacy/foreign field and gets dropped.
  const INVENTORY_KEYS = new Set([
    'last_updated',
    'base_spirits',
    'fortified_wines_and_aperitif_wines',
    'liqueurs_and_cordials',
    'bitters',
    'syrups',
    'non_alcoholic_spirits',
    'mixers',
    'refrigerator_perishables',
    'pantry_spice_rack',
    'fresh_produce',
    'specialty_ingredients',
    'garnish_and_service',
    'past_inventory',
    'vetoes',
    'shopping_list',
    'agent_notes',
    'unassigned',
    'equipment',
  ]);

  const BASE_SPIRIT_SECTIONS = ['whiskey', 'brandy', 'rum', 'agave', 'white_spirits', 'other'];
  const LIQUEUR_SECTIONS     = ['fruit_forward', 'nut_coffee', 'herbal', 'specialty_regional'];
  const BITTERS_SECTIONS     = ['anchors', 'aromatic_smoke', 'nut_earth', 'fruit_botanical', 'other'];

  const OLD_TIER_VALUES  = new Set(['industrial', 'premium-accessible', 'boutique', 'rare/exceptional']);
  const VALID_STRAINERS  = new Set(['Hawthorne', 'Julep', 'Fine Mesh', 'Conical']);

  // Coerce a bottle entry to the canonical {style, ...} object form (Phase 4 schema).
  // Migration rules:
  //   string         → { style: entry, created_at, updated_at }
  //   { name }       → { style: name, ...rest } (legacy {name} format)
  //   { style }      → preserved as-is (already migrated)
  //   old tier vals  → cleared to '' so the select renders as unset
  //   timestamps     → added if missing
  function coerceBottle(entry) {
    const nowIso = new Date().toISOString();
    if (typeof entry === 'string') {
      return entry ? { style: entry, created_at: nowIso, updated_at: nowIso } : null;
    }
    if (!entry || typeof entry !== 'object') return null;
    const out = { ...entry };
    // Migrate {name} → {style}
    if (!out.style && out.name) {
      out.style = out.name;
    }
    delete out.name;
    // Recover style from fallback fields if still missing
    if (!out.style) {
      const fallback = out.brand || out.type;
      if (typeof fallback === 'string' && fallback) out.style = fallback;
      else return null;
    }
    // Clear legacy tier values (D-05) — empty string so the select renders as unset
    if (out.tier && OLD_TIER_VALUES.has(out.tier)) {
      out.tier = '';
    }
    // Ensure ISO timestamps
    if (!out.created_at || typeof out.created_at !== 'string') out.created_at = nowIso;
    if (!out.updated_at || typeof out.updated_at !== 'string') out.updated_at = nowIso;
    return out;
  }

  function coerceBottleArray(arr) {
    return ensureArray(arr).map(coerceBottle).filter(Boolean);
  }

  function inventory(data) {
    const src = ensureObject(data);
    const out = {};

    // Drop unknown top-level keys (legacy fields like "pantry: {}", "barware: {}")
    Object.keys(src).forEach(k => {
      if (INVENTORY_KEYS.has(k)) out[k] = src[k];
    });

    out.last_updated = ensureString(out.last_updated) || isoToday();

    // base_spirits: object of named bottle arrays
    const bs = ensureObject(out.base_spirits);
    out.base_spirits = {};
    BASE_SPIRIT_SECTIONS.forEach(s => {
      out.base_spirits[s] = coerceBottleArray(bs[s]);
    });

    // Bottle-array sections at top level
    out.fortified_wines_and_aperitif_wines = coerceBottleArray(out.fortified_wines_and_aperitif_wines);
    out.syrups                = coerceBottleArray(out.syrups);
    out.non_alcoholic_spirits = coerceBottleArray(out.non_alcoholic_spirits);

    // liqueurs_and_cordials: object of bottle arrays
    const lc = ensureObject(out.liqueurs_and_cordials);
    out.liqueurs_and_cordials = {};
    LIQUEUR_SECTIONS.forEach(s => {
      out.liqueurs_and_cordials[s] = coerceBottleArray(lc[s]);
    });

    // bitters: object of bottle arrays
    const bt = ensureObject(out.bitters);
    out.bitters = {};
    BITTERS_SECTIONS.forEach(s => {
      out.bitters[s] = coerceBottleArray(bt[s]);
    });

    // String-array sections (mixers, perishables, pantry, produce, specialty, garnish)
    out.mixers                   = ensureArray(out.mixers).map(String).filter(Boolean);
    out.refrigerator_perishables = ensureArray(out.refrigerator_perishables).map(String).filter(Boolean);
    out.pantry_spice_rack        = ensureArray(out.pantry_spice_rack).map(String).filter(Boolean);
    out.fresh_produce            = ensureArray(out.fresh_produce).map(String).filter(Boolean);
    out.specialty_ingredients    = ensureArray(out.specialty_ingredients).map(String).filter(Boolean);
    out.garnish_and_service      = ensureArray(out.garnish_and_service).map(String).filter(Boolean);

    // past_inventory: array of {item, notes?}
    out.past_inventory = ensureArray(out.past_inventory)
      .map(e => (typeof e === 'string') ? { item: e } : (e && typeof e === 'object' ? e : null))
      .filter(Boolean);

    // vetoes: object with two arrays
    const v = ensureObject(out.vetoes);
    out.vetoes = {
      disliked_ingredients: ensureArray(v.disliked_ingredients).map(String).filter(Boolean),
      substitute_for_now:   ensureArray(v.substitute_for_now).filter(s => s && typeof s === 'object' && s.missing && s.substitute),
    };

    // shopping_list: array of {item, ...}
    out.shopping_list = ensureArray(out.shopping_list).filter(s => s && typeof s === 'object' && s.item);

    // unassigned: Phase 2 paste bucket — array of strings or bottle objects, accept either
    out.unassigned = ensureArray(out.unassigned).map(e => typeof e === 'string' ? e : coerceBottle(e)).filter(Boolean);

    // agent_notes: optional string
    if ('agent_notes' in out) out.agent_notes = ensureString(out.agent_notes);

    // equipment: always emit with validated strainers (Phase 4 D-11)
    const eq = ensureObject(out.equipment);
    out.equipment = {
      ...eq,
      strainers: ensureArray(eq.strainers).filter(s => VALID_STRAINERS.has(s)),
    };

    return out;
  }

  function barkeeper(data) {
    const src = ensureObject(data);
    const id = ensureObject(src.identity);
    return {
      ...src,
      identity: {
        name:             ensureString(id.name) || 'Barkeeper Bjorn',
        foundation_model: ensureString(id.foundation_model) || 'Claude Sonnet 4.6',
        persona_version:  ensureString(id.persona_version) || '1.0',
        ...id,
      },
      last_updated: ensureString(src.last_updated) || isoToday(),
    };
  }

  function profile(data) {
    const src = ensureObject(data);
    const fp  = ensureObject(src.flavor_profile);
    return {
      ...src,
      identity:       ensureObject(src.identity),
      flavor_profile: {
        axes:         ensureObject(fp.axes),
        supplemental: ensureObject(fp.supplemental),
        ...fp,
      },
      last_updated: ensureString(src.last_updated) || isoToday(),
    };
  }

  function recipes(data) {
    const src = ensureObject(data);
    // Migrate legacy `favorites` → canonical `confirmed_favorites` if present
    const cf = Array.isArray(src.confirmed_favorites)
      ? src.confirmed_favorites
      : ensureArray(src.favorites);
    const out = {
      ...src,
      originals:           ensureArray(src.originals).filter(r => r && typeof r === 'object'),
      confirmed_favorites: ensureArray(cf).filter(r => r && typeof r === 'object'),
      wishlist:            ensureArray(src.wishlist).filter(r => r && typeof r === 'object'),
      last_updated:        ensureString(src.last_updated) || isoToday(),
    };
    delete out.favorites;
    return out;
  }

  // Dispatch by State key
  function byKey(key, data) {
    if (key === 'inventory') return inventory(data);
    if (key === 'barkeeper') return barkeeper(data);
    if (key === 'profile')   return profile(data);
    if (key === 'recipes')   return recipes(data);
    return data;
  }

  return { inventory, barkeeper, profile, recipes, byKey };
})();
