// Config loader — fetches app/config/*.json once at startup and provides
// synchronous accessors for all lookup tables used by the views.
// All tables come from human-editable JSON files; no code changes needed
// to add new categories, brands, or type keywords.

const Config = (() => {
  let _ic = null; // inventory-config.json
  let _bc = null; // brand-catalog.json

  // Resolve a path relative to the app root (works on GH Pages and local dev).
  function _appPath(rel) {
    // Find the base URL from the index.html location (not the script location).
    const base = document.querySelector('base')?.href
      || window.location.href.replace(/[^/]*$/, '');
    return new URL(rel, base).href;
  }

  async function load() {
    if (_ic && _bc) return; // already loaded
    const [ic, bc] = await Promise.all([
      fetch(_appPath('config/inventory-config.json')).then(r => {
        if (!r.ok) throw new Error(`inventory-config.json: ${r.status}`);
        return r.json();
      }),
      fetch(_appPath('config/brand-catalog.json')).then(r => {
        if (!r.ok) throw new Error(`brand-catalog.json: ${r.status}`);
        return r.json();
      }),
    ]);
    _ic = ic;
    _bc = bc;
  }

  // ─── Accessors ──────────────────────────────────────────────────────

  /** Array of canonical category strings for the Category dropdown. */
  function categories()        { return _ic?.categories ?? []; }

  /** {sectionKey → categoryString} — default category per inventory section. */
  function sectionStyle()      { return _ic?.sectionStyle ?? {}; }

  /** {sectionKey → shortTypeString} — fallback type when no keyword matches. */
  function sectionTypeDefault(){ return _ic?.sectionTypeDefault ?? {}; }

  /** Array of {key, words[]} quick-add routing rules (most-specific first). */
  function quickAddRules()     { return _ic?.quickAddRules ?? []; }

  /** Array of tier value strings, e.g. ["well","standard",...]. */
  function tiers()             { return _ic?.tiers ?? []; }

  /** {tierValue → displayLabel} map. */
  function tierLabels()        { return _ic?.tierLabels ?? {}; }

  /** Array of suggested type strings for the datalist autocomplete. */
  function typeOptions()       { return _ic?.typeOptions ?? []; }

  /** Array of equipment strainer option strings. */
  function strainerOptions()   { return _ic?.strainerOptions ?? []; }

  /**
   * TYPE_KEYWORDS format: [[keyword, typeName], ...] — longest first.
   * Converted from JSON objects so inventory.js iteration is unchanged.
   */
  function typeKeywords() {
    return (_bc?.typeKeywords ?? []).map(({ keyword, type }) => [keyword, type]);
  }

  /**
   * BRAND_CATALOG format: [[keyword, {brand, typeHint}], ...] — longest first.
   * Converted from JSON objects so inventory.js iteration is unchanged.
   */
  function brandCatalog() {
    return (_bc?.brands ?? []).map(({ keyword, brand, typeHint }) => [keyword, { brand, typeHint }]);
  }

  return {
    load,
    categories, sectionStyle, sectionTypeDefault, quickAddRules,
    tiers, tierLabels, typeOptions, strainerOptions,
    typeKeywords, brandCatalog,
  };
})();
