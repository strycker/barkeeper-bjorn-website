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
    'mixers_bottles',
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
    // Ensure string fields default to empty string
    out.nationality = ensureString(out.nationality);
    out.region      = ensureString(out.region);
    out.subtype     = ensureString(out.subtype);
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
    out.mixers_bottles        = coerceBottleArray(out.mixers_bottles);
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
    const out = {
      ...src,
      identity: {
        name:             ensureString(id.name) || 'Barkeeper Bjorn',
        foundation_model: ensureString(id.foundation_model) || 'Claude Sonnet 4.6',
        persona_version:  ensureString(id.persona_version) || '1.0',
        ...id,
      },
      last_updated: ensureString(src.last_updated) || isoToday(),
    };
    // DATA-01: strip equipment from barkeeper — inventory.json is the sole source of truth
    delete out.equipment;
    out.avatar_url              = ensureString(out.avatar_url);
    out.personality_description = ensureString(out.personality_description);
    out.cocktail_naming_style   = ensureString(out.cocktail_naming_style);
    out.image_gen_style         = ensureString(out.image_gen_style);
    out.signoff                 = ensureString(out.signoff);
    out.behavioral_rules        = ensureArray(out.behavioral_rules).filter(r => typeof r === 'string' && r.length);
    return out;
  }

  // DATA-02: axis string→float position map
  const POS_MAP = { 'Strong A': 0, 'Lean A': 0.25, 'Middle': 0.5, 'Lean B': 0.75, 'Strong B': 1 };
  const AXIS_KEYS = ['sweetness', 'acid', 'strength', 'complexity', 'season', 'risk'];

  function profile(data) {
    const src = ensureObject(data);

    // DATA-02: migrate string axis positions to floats
    const fp   = ensureObject(src.flavor_profile);
    const axes = ensureObject(fp.axes);
    for (const k of AXIS_KEYS) {
      const a = ensureObject(axes[k]);
      if (typeof a.position === 'string' && POS_MAP[a.position] != null) {
        a.position = POS_MAP[a.position];
      }
      axes[k] = a;
    }
    fp.axes = axes;

    const out = {
      ...src,
      identity:       ensureObject(src.identity),
      flavor_profile: {
        axes:         ensureObject(fp.axes),
        supplemental: ensureObject(fp.supplemental),
        ...fp,
      },
      last_updated: ensureString(src.last_updated) || isoToday(),
    };

    // DATA-01: strip equipment from profile — inventory.json is the sole source of truth
    delete out.equipment;

    // DATA-03: default rich profile fields
    const bg = ensureObject(out.background);
    bg.drinking_frequency    = ensureString(bg.drinking_frequency);
    bg.household_context     = ensureString(bg.household_context);
    bg.vocabulary_preference = ensureString(bg.vocabulary_preference);
    out.background = bg;

    out.archetypes = ensureArray(out.archetypes).filter(a => a && typeof a === 'object' && typeof a.name === 'string' && a.name.length);

    return out;
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

  // Phase 7 D-11: 5th data file. Each entry carries _source:'ai-generated' (re-tagged
  // to 'originals' on promote). Field allowlist mirrors schema/drafts.schema.json.
  const DRAFT_ITEM_KEYS = new Set([
    '_source', 'draft_id', 'created_at', 'updated_at', 'source_prompt',
    'name', 'tagline', 'base', 'method', 'method_type', 'glassware', 'garnish',
    'occasion', 'ingredients', 'notes', 'tasting_notes', 'why_it_works',
  ]);

  function _coerceDraft(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const out = {};
    Object.keys(entry).forEach(k => {
      if (DRAFT_ITEM_KEYS.has(k)) out[k] = entry[k];
    });
    out.name = ensureString(out.name);
    if (!out.name) return null;
    // Provenance tag — always 'ai-generated' on the drafts file (idempotent).
    out._source = 'ai-generated';
    // Coerce ingredient array to {name, amount, notes?} shape.
    if (Array.isArray(out.ingredients)) {
      out.ingredients = out.ingredients
        .filter(i => i && typeof i === 'object')
        .map(i => {
          const ing = { name: ensureString(i.name), amount: ensureString(i.amount) };
          if (i.notes) ing.notes = ensureString(i.notes);
          return ing;
        });
    } else if (out.ingredients != null) {
      delete out.ingredients;
    }
    return out;
  }

  function drafts(data) {
    const src = ensureObject(data);
    return {
      drafts:       ensureArray(src.drafts).map(_coerceDraft).filter(Boolean),
      last_updated: ensureString(src.last_updated) || isoToday(),
    };
  }

  // Phase 7 LIB-01 (D-13): 6th data file — user-curated external links.
  // Allowlist mirrors schema/library.schema.json linkItem. CRUD only — no
  // AI write payload, so no WriteGate needed; Normalize handles coercion.
  const LIBRARY_ITEM_KEYS = new Set(['url', 'title', 'description', 'tags']);

  function _coerceLibraryLink(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const out = {};
    Object.keys(entry).forEach(k => {
      if (LIBRARY_ITEM_KEYS.has(k)) out[k] = entry[k];
    });
    out.url = ensureString(out.url).trim();
    if (!out.url) return null;
    // Title falls back to URL when missing.
    out.title       = ensureString(out.title) || out.url;
    out.description = ensureString(out.description);
    // Tags: array of non-empty strings.
    out.tags = ensureArray(out.tags)
      .map(t => ensureString(t).trim())
      .filter(Boolean);
    return out;
  }

  function library(data) {
    const src = ensureObject(data);
    return {
      links:        ensureArray(src.links).map(_coerceLibraryLink).filter(Boolean),
      last_updated: ensureString(src.last_updated) || isoToday(),
    };
  }

  // Dispatch by State key
  function byKey(key, data) {
    if (key === 'inventory') return inventory(data);
    if (key === 'barkeeper') return barkeeper(data);
    if (key === 'profile')   return profile(data);
    if (key === 'recipes')   return recipes(data);
    if (key === 'drafts')    return drafts(data);
    if (key === 'library')   return library(data);
    return data;
  }

  return { inventory, barkeeper, profile, recipes, drafts, library, byKey };
})();
