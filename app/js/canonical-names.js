// Canonical name matcher — curated lookup table + Levenshtein fallback.
// Prevents inventory drift from typos and non-canonical bottle names.
// Usage: CanonicalNames.suggest(input) → { canonical, distance } | null

const CanonicalNames = (() => {
  // Seeded from classics-db ingredient .name values + common brand/bottle names.
  const CURATED = [
    'Angostura Bitters','Peychaud\'s Bitters','Orange Bitters','Cointreau','Grand Marnier',
    'Campari','Aperol','Chartreuse','Green Chartreuse','Yellow Chartreuse','Fernet-Branca',
    'Bénédictine','Lillet Blanc','Dolin Dry','Dolin Rouge','Carpano Antica','Punt e Mes',
    'Maraschino Liqueur','Luxardo Maraschino','St-Germain','Drambuie','Falernum',
    'Allspice Dram','Crème de Cassis','Crème de Violette','Crème de Menthe','Crème de Cacao',
    'Galliano','Domaine de Canton','Suze','Cynar','Averna','Amaro Nonino','Pimm\'s No. 1',
    'Bourbon','Rye','Scotch','Irish Whiskey','Japanese Whisky','Mezcal','Tequila',
    'Gin','London Dry Gin','Vodka','Cognac','Calvados','Pisco','Rhum Agricole',
    'Maker\'s Mark','Buffalo Trace','Bulleit','Wild Turkey','Rittenhouse','Laphroaig',
    'Lagavulin','Glenlivet','Tanqueray','Bombay Sapphire','Hendrick\'s','Plymouth',
    'Beefeater','Mount Gay','Plantation','Bacardi','Don Julio','Patrón','Casamigos',
    'Simple Syrup','Demerara Syrup','Honey Syrup','Honey-Ginger Syrup','Orgeat','Grenadine',
  ];

  function lev(a, b) {
    // Standard Levenshtein, iterative, O(a*b) space-optimized to 2 rows.
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    let curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length];
  }

  function suggest(input) {
    if (!input || typeof input !== 'string') return null;
    const q = input.trim();
    if (!q) return null;
    const qLower = q.toLowerCase();
    // Exact (case-insensitive) match → no suggestion.
    for (const c of CURATED) {
      if (c.toLowerCase() === qLower) return null;
    }
    const threshold = q.length < 8 ? 2 : 3;
    let best = null;
    for (const c of CURATED) {
      const d = lev(qLower, c.toLowerCase());
      if (d <= threshold && (!best || d < best.distance)) {
        best = { canonical: c, distance: d };
      }
    }
    return best;
  }

  return { suggest };
})();

window.CanonicalNames = CanonicalNames;
