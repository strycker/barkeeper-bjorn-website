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

  // ─── Recipes v2 (pool) ────────────────────────────────────────────────
  // Single canonical pool. See .planning/chip-unification-plan.md.
  //
  // v1 stored recipes across several arrays inside data/recipes.json
  // (originals / confirmed_favorites / wishlist / made_log) and a separate
  // data/drafts.json. v2 collapses these into a single `pool` array where
  // each entry has a `status` ("classic" | "original" | "draft") and
  // boolean/list overlay flags (is_favorite / is_wishlist / made_log).
  // Classics live read-only in classics-db*.js; pool entries with `seed_id`
  // are OVERLAY-ONLY references (no core fields stored — core is read live
  // from CLASSICS_DB at render time).
  //
  // Migration is idempotent: recipes({pool: [...]}) is a no-op; recipes({
  // originals, confirmed_favorites, wishlist, made_log }) produces a fresh
  // pool. Drafts are folded in by state.js after loadAll (it has both
  // recipes and drafts files in hand). recipe() coerces a single entry.

  const RECIPE_CORE_KEYS = new Set([
    'name', 'tagline', 'base', 'method', 'method_type', 'glassware', 'garnish',
    'difficulty', 'ingredients', 'profile', 'tags', 'specialties', 'occasion',
    'creator', 'date_created', 'why_it_works',
  ]);
  const RECIPE_OVERLAY_KEYS = new Set([
    'is_favorite', 'is_wishlist', 'is_hidden', 'is_original',
    'made_log', 'ratings', 'user_notes', 'images',
    'confirmed_built', 'date_confirmed',
  ]);
  const RECIPE_DRAFT_KEYS = new Set([
    'draft_id', 'source_prompt', 'parent_id', 'created_at', 'updated_at',
  ]);
  const RECIPE_META_KEYS = new Set(['id', 'status', '_source', 'seed_id']);

  function _coerceIngredient(i) {
    if (!i || typeof i !== 'object') return null;
    const out = { name: ensureString(i.name), amount: ensureString(i.amount) };
    if (i.notes)    out.notes = ensureString(i.notes);
    if (Array.isArray(i.keywords)) out.keywords = i.keywords.filter(k => typeof k === 'string');
    if (Array.isArray(i.searchIn)) out.searchIn = i.searchIn.filter(k => typeof k === 'string');
    if (i.optional === true) out.optional = true;
    return out.name ? out : null;
  }

  function _emptyMadeLog() { return []; }

  // Idempotent coercion of a single pool entry to canonical Recipe shape.
  // Tolerates missing fields, drops unknown ones. Auto-fills sensible
  // defaults (status, _source) when callable from migration paths.
  function recipe(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const out = {};
    // Meta
    out.id      = ensureString(entry.id);
    out.status  = ['classic', 'original', 'draft'].includes(entry.status) ? entry.status : 'original';
    out._source = ['seed', 'user', 'ai-generated'].includes(entry._source) ? entry._source
                : (out.status === 'classic' ? 'seed'
                : out.status === 'draft'   ? 'ai-generated' : 'user');
    if (entry.seed_id) out.seed_id = ensureString(entry.seed_id);
    // Core
    Object.keys(entry).forEach(k => {
      if (RECIPE_CORE_KEYS.has(k) && entry[k] != null) out[k] = entry[k];
    });
    out.name = ensureString(out.name);
    if (Array.isArray(out.ingredients)) {
      out.ingredients = out.ingredients.map(_coerceIngredient).filter(Boolean);
    }
    // Overlay
    Object.keys(entry).forEach(k => {
      if (RECIPE_OVERLAY_KEYS.has(k) && entry[k] != null) out[k] = entry[k];
    });
    out.is_favorite = !!out.is_favorite;
    out.is_wishlist = !!out.is_wishlist;
    out.is_hidden   = !!out.is_hidden;
    // is_original — editable overlay tag (default off for classics + drafts;
    // default ON for user-authored entries with status:'original'). Always
    // forced false when seed_id is set so a classic's tag stays correct.
    if (out.seed_id) {
      out.is_original = false;
    } else if (typeof entry.is_original === 'boolean') {
      out.is_original = entry.is_original;
    } else {
      out.is_original = out.status === 'original';
    }
    out.made_log    = Array.isArray(out.made_log) ? out.made_log.filter(m => m && typeof m === 'object') : _emptyMadeLog();
    // Draft-only fields (only carried when status === 'draft')
    if (out.status === 'draft') {
      Object.keys(entry).forEach(k => {
        if (RECIPE_DRAFT_KEYS.has(k) && entry[k] != null) out[k] = entry[k];
      });
      if (!out.draft_id) out.draft_id = out.id || ('draft' + Date.now());
    }
    // Ensure id exists (fall back to seed_id / draft_id / a generated one).
    if (!out.id) out.id = out.seed_id || out.draft_id || ('cocktail' + Date.now());
    // Seeded chips are overlay-only: drop core fields so they cannot drift
    // from the classics-db source of truth. Only the overlay layer is stored.
    // is_original is also force-cleared here as a third defense layer (in
    // addition to the assignment above + the schema default).
    if (out.seed_id) {
      for (const k of RECIPE_CORE_KEYS) delete out[k];
      out.status = 'classic';
      out._source = 'seed';
      out.is_original = false;
    }
    return out.id ? out : null;
  }

  // Migration helper: build a pool from v1 shape arrays.
  // `lookupSeed(recipe) -> seedId | null` resolves whether a v1 entry
  // matches a classics-db seed (by id or name). Pure — caller passes the
  // map so node tests stay deterministic.
  function _migrateV1ToPool(src, lookupSeed) {
    const pool = [];
    const byId = {};

    const upsert = (poolEntry) => {
      if (!poolEntry || !poolEntry.id) return null;
      if (byId[poolEntry.id]) {
        // Merge into existing. made_log is concat-merged below; all other
        // overlay scalars take the truthy value from poolEntry. Skip
        // made_log in the forEach so the explicit concat is not overwritten.
        const existing = byId[poolEntry.id];
        Object.keys(poolEntry).forEach(k => {
          if (k === 'made_log') return;
          if (RECIPE_OVERLAY_KEYS.has(k) && poolEntry[k]) existing[k] = poolEntry[k];
        });
        if (poolEntry.is_favorite) existing.is_favorite = true;
        if (poolEntry.is_wishlist) existing.is_wishlist = true;
        if (Array.isArray(poolEntry.made_log) && poolEntry.made_log.length) {
          existing.made_log = (Array.isArray(existing.made_log) ? existing.made_log : []).concat(poolEntry.made_log);
        }
        return existing;
      }
      byId[poolEntry.id] = poolEntry;
      pool.push(poolEntry);
      return poolEntry;
    };

    // Originals → status: 'original', _source: 'user'.
    ensureArray(src.originals).forEach(r => {
      if (!r || typeof r !== 'object') return;
      upsert(recipe({ ...r, status: 'original', _source: 'user' }));
    });

    // Confirmed favorites → either set is_favorite on a matching entry,
    // or add an overlay-only entry referencing a classics-db seed.
    ensureArray(src.confirmed_favorites || src.favorites).forEach(r => {
      if (!r || typeof r !== 'object') return;
      const seedId = lookupSeed ? lookupSeed(r) : null;
      if (seedId) {
        upsert(recipe({ id: seedId, seed_id: seedId, status: 'classic', _source: 'seed', is_favorite: true }));
        return;
      }
      // Standalone snapshot: preserve as an original with is_favorite.
      const id = r.id || ('cocktail' + Date.now() + Math.floor(Math.random() * 1000));
      upsert(recipe({ ...r, id, status: 'original', _source: 'user', is_favorite: true }));
    });

    // Wishlist → same pattern but is_wishlist.
    ensureArray(src.wishlist).forEach(r => {
      if (!r || typeof r !== 'object') return;
      const seedId = lookupSeed ? lookupSeed(r) : null;
      if (seedId) {
        upsert(recipe({ id: seedId, seed_id: seedId, status: 'classic', _source: 'seed', is_wishlist: true }));
        return;
      }
      const id = r.id || ('cocktail' + Date.now() + Math.floor(Math.random() * 1000));
      upsert(recipe({ ...r, id, status: 'original', _source: 'user', is_wishlist: true }));
    });

    // Made log → push to made_log array. Preserve times_made/first_made/
    // last_made/notes as a single condensed entry per v1 row.
    ensureArray(src.made_log).forEach(r => {
      if (!r || typeof r !== 'object') return;
      const seedId = lookupSeed ? lookupSeed(r) : null;
      const logEntry = {
        date:       ensureString(r.last_made) || ensureString(r.first_made) || isoToday(),
        notes:      ensureString(r.notes),
        times_made: typeof r.times_made === 'number' && r.times_made > 0 ? r.times_made : 1,
      };
      if (seedId) {
        upsert(recipe({ id: seedId, seed_id: seedId, status: 'classic', _source: 'seed', made_log: [logEntry] }));
        return;
      }
      const id = r.id || ('cocktail' + Date.now() + Math.floor(Math.random() * 1000));
      upsert(recipe({ ...r, id, status: 'original', _source: 'user', made_log: [logEntry] }));
    });

    return pool;
  }

  // Default classics-db lookup: tries id match first, then a TOLERANT name
  // match. Tolerance is intentional: v1 entries may have stripped-down
  // shapes where the id is missing and the name is the only handle, and
  // the canonical classics-db ids ('army-and-navy') vs display names
  // ('Army & Navy') have different separators / punctuation. Both sides
  // are normalized to lowercase alphanumerics-only before comparison so
  // "Army & Navy" matches "Army and Navy" matches "army-and-navy" matches
  // "armyandnavy". Returns the seed's id (i.e. CLASSICS_DB[i].id) or null.
  function _normForMatch(s) {
    if (typeof s !== 'string') return '';
    return s.toLowerCase()
            .replace(/&/g, ' and ')      // 'Army & Navy' / 'army and navy' / 'army-and-navy' all collapse
            .replace(/[^a-z0-9]+/g, '');
  }
  function _defaultLookupSeed(entry) {
    if (typeof globalThis === 'undefined' || !Array.isArray(globalThis.CLASSICS_DB)) return null;
    const id = entry && entry.id;
    if (id && globalThis.CLASSICS_DB.some(c => c.id === id)) return id;
    const wantId   = _normForMatch(id);
    const wantName = _normForMatch(entry && entry.name);
    if (!wantId && !wantName) return null;
    const hit = globalThis.CLASSICS_DB.find(c => {
      const cid   = _normForMatch(c.id);
      const cname = _normForMatch(c.name);
      return (wantId   && cid   && cid   === wantId)
          || (wantName && cname && cname === wantName);
    });
    return hit ? hit.id : null;
  }

  function recipes(data) {
    const src = ensureObject(data);
    // Already migrated — idempotent.
    if (Array.isArray(src.pool)) {
      return {
        _schema_version: 2,
        pool:            src.pool.map(recipe).filter(Boolean),
        last_updated:    ensureString(src.last_updated) || isoToday(),
        ...(src.profile_coverage_matrix ? { profile_coverage_matrix: src.profile_coverage_matrix } : {}),
      };
    }
    // v1 → v2 migration. Pure: lookup function defaults to globalThis.CLASSICS_DB.
    const pool = _migrateV1ToPool(src, _defaultLookupSeed);
    return {
      _schema_version: 2,
      pool,
      last_updated:    ensureString(src.last_updated) || isoToday(),
      ...(src.profile_coverage_matrix ? { profile_coverage_matrix: src.profile_coverage_matrix } : {}),
    };
  }

  // Test-friendly migration entry point: callers (state.js, tests) can pass
  // a custom seed lookup to avoid reaching into globalThis.
  function migrateRecipesV1(src, lookupSeed) {
    return {
      _schema_version: 2,
      pool: _migrateV1ToPool(ensureObject(src), lookupSeed || _defaultLookupSeed),
      last_updated: ensureString(src && src.last_updated) || isoToday(),
    };
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

  // reclassifyExistingPool — one-time corrective pass that runs once per
  // pool. Finds entries with status:'original' (no seed_id) whose `name`
  // matches a classics-db seed and converts them to overlay-only seeded
  // entries, preserving every overlay flag (is_favorite / is_wishlist /
  // is_hidden / made_log / ratings / user_notes / images).
  //
  // Why this exists: the v1->v2 migration's lookupSeed runs at load time;
  // if a v1 confirmed_favorites/wishlist/made_log entry was missing an `id`
  // OR had a stripped-down shape, the seed lookup could fall through and
  // the entry would land in the pool as a phantom `status:'original'` —
  // visible to the user as a wrongly-tagged "Original" badge on a classic
  // like Army & Navy or French 75. Reclassify is the cleanup pass.
  //
  // Also dedupes: when a reclassified entry's new seed_id collides with an
  // existing pool entry, merges overlay flags (truthy wins) and drops the
  // duplicate so the pool ends up with one entry per seeded classic.
  //
  // Idempotent via the `_reclassified_v2_1` flag on the pool object.
  function reclassifyExistingPool(recipesV2, lookupSeed) {
    if (!recipesV2 || !Array.isArray(recipesV2.pool)) return recipesV2;
    if (recipesV2._reclassified_v2_1) return recipesV2;
    const lookup = lookupSeed || _defaultLookupSeed;
    const bySeedId = {};
    const newPool = [];
    let changed = false;
    recipesV2.pool.forEach(entry => {
      // Seeded entries pass through unchanged.
      if (entry.seed_id) {
        if (bySeedId[entry.seed_id]) {
          // Already saw a seeded entry with this id — merge overlay flags.
          const existing = bySeedId[entry.seed_id];
          if (entry.is_favorite) existing.is_favorite = true;
          if (entry.is_wishlist) existing.is_wishlist = true;
          if (entry.is_hidden)   existing.is_hidden   = true;
          if (Array.isArray(entry.made_log) && entry.made_log.length) {
            existing.made_log = (Array.isArray(existing.made_log) ? existing.made_log : []).concat(entry.made_log);
          }
          changed = true;
          return;
        }
        bySeedId[entry.seed_id] = entry;
        newPool.push(entry);
        return;
      }
      // Drafts pass through unchanged.
      if (entry.status === 'draft') {
        newPool.push(entry);
        return;
      }
      // status:'original' with no seed_id — try to match a classics-db seed.
      const seedId = lookup({ id: entry.id, name: entry.name });
      if (!seedId) {
        // Truly a user original.
        newPool.push(entry);
        return;
      }
      // Convert to overlay-only seeded entry, preserving every flag the
      // phantom-original was carrying.
      changed = true;
      const reclassified = recipe({
        id: seedId,
        seed_id: seedId,
        status: 'classic',
        _source: 'seed',
        is_favorite: !!entry.is_favorite,
        is_wishlist: !!entry.is_wishlist,
        is_hidden:   !!entry.is_hidden,
        made_log:    Array.isArray(entry.made_log) ? entry.made_log : [],
        ratings:     entry.ratings,
        user_notes:  entry.user_notes,
        images:      entry.images,
      });
      if (!reclassified) return;
      if (bySeedId[seedId]) {
        // Collision with an existing seeded entry — merge overlay flags.
        const existing = bySeedId[seedId];
        if (reclassified.is_favorite) existing.is_favorite = true;
        if (reclassified.is_wishlist) existing.is_wishlist = true;
        if (reclassified.is_hidden)   existing.is_hidden   = true;
        if (reclassified.made_log && reclassified.made_log.length) {
          existing.made_log = (Array.isArray(existing.made_log) ? existing.made_log : []).concat(reclassified.made_log);
        }
        if (!existing.user_notes && reclassified.user_notes) existing.user_notes = reclassified.user_notes;
        return;
      }
      bySeedId[seedId] = reclassified;
      newPool.push(reclassified);
    });
    return {
      ...recipesV2,
      pool: newPool,
      _reclassified_v2_1: true,
      last_updated: changed ? isoToday() : recipesV2.last_updated,
    };
  }

  // foldDraftsIntoPool — called by state.js after loadAll when a legacy
  function foldDraftsIntoPool(recipesV2, draftsLegacy) {
    if (!recipesV2 || !Array.isArray(recipesV2.pool)) return recipesV2;
    const draftsList = ensureArray(draftsLegacy && draftsLegacy.drafts);
    if (!draftsList.length) return recipesV2;
    const pool = recipesV2.pool.slice();
    const byDraftId = {};
    pool.forEach((p, i) => { if (p && p.draft_id) byDraftId[p.draft_id] = i; });
    draftsList.forEach(d => {
      if (!d || typeof d !== 'object') return;
      const entry = recipe({
        ...d,
        status:   'draft',
        _source:  'ai-generated',
        draft_id: d.draft_id || ('draft' + Date.now() + Math.floor(Math.random() * 1000)),
        id:       d.id || d.draft_id || ('draft' + Date.now() + Math.floor(Math.random() * 1000)),
      });
      if (!entry) return;
      const existingIdx = byDraftId[entry.draft_id];
      if (existingIdx != null) pool[existingIdx] = entry;
      else pool.push(entry);
    });
    return { ...recipesV2, pool, last_updated: isoToday() };
  }

  return {
    inventory, barkeeper, profile, recipes, drafts, library, byKey,
    // v2 chip unification helpers:
    recipe, migrateRecipesV1, foldDraftsIntoPool, reclassifyExistingPool,
  };
})();
