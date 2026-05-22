// classics-db-extra-3.js — additional curated recipes.
// Loaded after classics-db-extra-2.js; extends CLASSICS_DB.

CLASSICS_DB.push(...[

  // ─── CHAMPAGNE & SPARKLING ────────────────────────────────────────

  { id: 'east-india-75', name: 'East India 75', base: 'Gin',
    method: 'shaken', glassware: 'Flute or coupe', difficulty: 3,
    profile: { sweetness: 0.3, acid: 0.45, strength: 0.35, complexity: 0.65, season: 0.5, risk: 0.45 },
    occasion: 'A French 75 that drifted through a spice market. Sherry adds oxidative/nutty bass, cardamom broadens the midpalate where elderflower never quite does, and Angostura gives hidden structural bitterness — more "adult" than a standard French 75 while staying elegant.',
    tags: ['party', 'brunch', 'spirit-forward'],
    specialties: ['contemporary'],
    ingredients: [
      { name: 'London Dry Gin', amount: '1½ oz', keywords: ['gin', 'london dry'], searchIn: ['white_spirits'] },
      { name: 'Amontillado Sherry', amount: '½ oz', keywords: ['sherry', 'amontillado', 'oloroso', 'dry sherry'], searchIn: ['fortified'] },
      { name: 'Fresh Lemon Juice', amount: '½ oz', keywords: ['lemon', 'citrus'], searchIn: ['produce', 'perishables'] },
      { name: 'Cardamom Honey Syrup (1:1)', amount: '0.35 oz', keywords: ['honey', 'cardamom', 'honey syrup'], searchIn: ['syrups', 'pantry', 'perishables'] },
      { name: 'Angostura Bitters', amount: '1 dash', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
      { name: 'Champagne or Dry Cava', amount: '2–3 oz', keywords: ['champagne', 'cava', 'sparkling', 'prosecco'], searchIn: ['fortified', 'mixers'] },
    ],
    garnish: 'Expressed lemon peel + a tiny dusting of cardamom' },

]);
