// Recommender Engine — matches classics-db recipes against user inventory + flavor profile
const RecommenderEngine = (() => {

  // Safe lowercase — handles strings, bottle objects {style}, {name}, and null/undefined
  const lc = s => (typeof s === 'string' ? s : (s?.style ?? s?.name ?? String(s ?? ''))).toLowerCase();

  // Spirit subtype tokens — used to prevent cross-subtype false positives (BUG-02)
  const SUBTYPE_TOKENS = ['scotch', 'bourbon', 'rye', 'japanese', 'irish', 'canadian'];

  // Map classics-db searchIn keys → extractor functions for actual inventory structure
  // Inventory top-level: base_spirits{whiskey,brandy,rum,agave,white_spirits,other},
  //   fortified_wines_and_aperitif_wines[], liqueurs_and_cordials{fruit_forward,nut_coffee,herbal,specialty_regional},
  //   bitters{anchors,aromatic_smoke,nut_earth,fruit_botanical,other},
  //   syrups[], mixers[], refrigerator_perishables[], pantry_spice_rack[], fresh_produce[], vetoes{...}
  const SECTION_MAP = {
    whiskey:            inv => (inv.base_spirits?.whiskey || []).map(lc),
    brandy:             inv => (inv.base_spirits?.brandy  || []).map(lc),
    rum:                inv => (inv.base_spirits?.rum      || []).map(lc),
    agave:              inv => (inv.base_spirits?.agave    || []).map(lc),
    white_spirits:      inv => (inv.base_spirits?.white_spirits || []).map(lc),
    other_spirits:      inv => [
      ...(inv.base_spirits?.other || []),
      ...(inv.non_alcoholic_spirits || []),
    ].map(lc),
    fortified:          inv => (inv.fortified_wines_and_aperitif_wines || []).map(lc),
    liqueurs_fruit:     inv => (inv.liqueurs_and_cordials?.fruit_forward     || []).map(lc),
    liqueurs_nut:       inv => (inv.liqueurs_and_cordials?.nut_coffee        || []).map(lc),
    liqueurs_herbal:    inv => (inv.liqueurs_and_cordials?.herbal            || []).map(lc),
    liqueurs_specialty: inv => (inv.liqueurs_and_cordials?.specialty_regional|| []).map(lc),
    bitters_anchors:    inv => [
      ...(inv.bitters?.anchors       || []),
      ...(inv.bitters?.aromatic_smoke|| []),
    ].map(lc),
    bitters_other:      inv => [
      ...(inv.bitters?.nut_earth      || []),
      ...(inv.bitters?.fruit_botanical|| []),
      ...(inv.bitters?.other          || []),
    ].map(lc),
    syrups:             inv => (inv.syrups              || []).map(lc),
    mixers:             inv => (inv.mixers              || []).map(lc),
    perishables:        inv => (inv.refrigerator_perishables || []).map(lc),
    pantry:             inv => (inv.pantry_spice_rack   || []).map(lc),
    produce:            inv => (inv.fresh_produce        || []).map(lc),
  };

  // Build a flat inventory lookup from all sections (cached per call)
  function _buildLookup(inv) {
    const lookup = {};
    Object.entries(SECTION_MAP).forEach(([key, fn]) => {
      lookup[key] = fn(inv);
    });
    return lookup;
  }

  // Check if a single ingredient is present (keyword match against specified sections)
  function _hasIngredient(lookup, ingredient) {
    const kws = ingredient.keywords.map(k => k.toLowerCase());
    const ingredientSubtypes = kws.filter(k => SUBTYPE_TOKENS.includes(k));
    for (const sectionKey of ingredient.searchIn) {
      const items = lookup[sectionKey] || [];
      for (const item of items) {
        for (const kw of kws) {
          if (!item.includes(kw)) continue;
          // Subtype guard: if the ingredient lists any subtype tokens
          // (e.g. 'scotch'), the matched item MUST contain at least one
          // of those subtype tokens. This prevents bare 'whisky' from
          // letting Japanese Whisky satisfy a Scotch recipe.
          if (ingredientSubtypes.length > 0) {
            const itemHasSubtype = ingredientSubtypes.some(st => item.includes(st));
            if (!itemHasSubtype) continue;
          }
          return { found: true, item };
        }
      }
    }
    return { found: false };
  }

  // Score a recipe against the user's flavor profile (0-1, higher = better match)
  function _flavorScore(recipe, profile) {
    if (!profile || !recipe.profile) return 0.5;
    const axes = ['sweetness', 'acid', 'strength', 'complexity', 'season', 'risk'];
    let total = 0;
    let count = 0;
    for (const axis of axes) {
      const userVal = profile[axis];
      const recipeVal = recipe.profile[axis];
      if (userVal == null || recipeVal == null) continue;
      total += 1 - Math.abs(userVal - recipeVal);
      count++;
    }
    return count > 0 ? total / count : 0.5;
  }

  // Convert profile axis position strings ("Strong A", "Lean B", etc.) to 0-1 values
  // Actual profile path: profile.flavor_profile.axes[axis].position
  function _normalizeProfile(rawProfile) {
    const axes = rawProfile && rawProfile.flavor_profile && rawProfile.flavor_profile.axes;
    if (!axes) return null;
    const map = { 'Strong A': 0, 'Lean A': 0.25, 'Middle': 0.5, 'Lean B': 0.75, 'Strong B': 1 };
    const keys = ['sweetness', 'acid', 'strength', 'complexity', 'season', 'risk'];
    const out = {};
    for (const k of keys) {
      const pos = axes[k] && axes[k].position;
      if (pos != null) {
        out[k] = typeof pos === 'number' ? pos : (map[pos] ?? 0.5);
      }
    }
    return Object.keys(out).length ? out : null;
  }

  // Main recommend function
  // Returns { buildable: [...], oneAway: [...], twoAway: [...] }
  // Each item: { recipe, flavorScore, missingIngredient?, missingIngredients? }
  function recommend(inventory, rawProfile) {
    // eslint-disable-next-line no-undef
    const db = (typeof CLASSICS_DB !== 'undefined') ? CLASSICS_DB : [];
    if (!db.length) return { buildable: [], oneAway: [], twoAway: [] };

    const inv = inventory || {};
    const lookup = _buildLookup(inv);
    const profile = _normalizeProfile(rawProfile);

    const buildable = [];
    const oneAway = [];
    const twoAway = [];

    // Collect vetoed items (vetoes is an object with sub-arrays in actual data)
    const vetoObj = inv.vetoes || {};
    const vetoes = [
      ...(Array.isArray(vetoObj) ? vetoObj : []),
      ...(vetoObj.disliked_ingredients || []),
      ...(vetoObj.substitute_for_now   || []),
    ].map(v => String(v).toLowerCase());

    for (const recipe of db) {
      // Check veto — skip any recipe whose base matches a vetoed spirit
      const baseStr = (recipe.base || '').toLowerCase();
      if (vetoes.some(v => baseStr.includes(v))) continue;

      const missing = [];
      for (const ing of recipe.ingredients) {
        const result = _hasIngredient(lookup, ing);
        if (!result.found) missing.push(ing);
      }

      const score = _flavorScore(recipe, profile);

      if (missing.length === 0) {
        buildable.push({ recipe, flavorScore: score });
      } else if (missing.length === 1) {
        oneAway.push({ recipe, flavorScore: score, missingIngredient: missing[0], missingIngredients: missing });
      } else if (missing.length === 2) {
        twoAway.push({ recipe, flavorScore: score, missingIngredients: missing });
      }
    }

    // Sort all lists by flavor score descending
    buildable.sort((a, b) => b.flavorScore - a.flavorScore);
    oneAway.sort((a, b) => b.flavorScore - a.flavorScore);
    twoAway.sort((a, b) => b.flavorScore - a.flavorScore);

    return { buildable, oneAway, twoAway };
  }

  // Public API
  return { recommend, normalizeProfile: _normalizeProfile };
})();
