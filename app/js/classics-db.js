// Built-in classics database — ~75 recipes with canonical ingredients and flavor profiles.
//
// Flavor profile axes (all 0..1):
//   sweetness:  0 = bone dry          → 1 = sweet/dessert
//   acid:       0 = no acid           → 1 = bright/tart
//   strength:   0 = spirit-forward    → 1 = refreshment-forward/low-ABV
//   complexity: 0 = simple/clean      → 1 = layered/brooding
//   season:     0 = year-round bright → 1 = warming/cozy/seasonal
//   risk:       0 = classic/known     → 1 = adventurous/unusual
//
// ingredient.searchIn keys map to inventory sections (see recommender-engine.js).
// ingredient.keywords are matched case-insensitively against bottle/item names.
// ingredient.optional = true means missing it doesn't block the recipe.

const CLASSICS_DB = [

  // ─── WHISKEY ──────────────────────────────────────────────────────

  { id: 'old-fashioned', name: 'Old Fashioned', base: 'Bourbon',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.15, acid: 0.0, strength: 0.05, complexity: 0.35, season: 0.55, risk: 0.05 },
    occasion: 'The gold-standard evening sipper. Spirit-forward, minimal intervention.',
    ingredients: [
      { name: 'Bourbon or Rye', amount: '2 oz', keywords: ['bourbon', 'rye', 'whiskey', 'whisky'], searchIn: ['whiskey'] },
      { name: 'Simple Syrup', amount: '¼ oz', keywords: ['simple', 'syrup', 'sugar', 'demerara', 'cane'], searchIn: ['syrups', 'pantry'] },
      { name: 'Angostura Bitters', amount: '2 dashes', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
    ],
    garnish: 'Orange twist or cherry' },

  { id: 'manhattan', name: 'Manhattan', base: 'Rye or Bourbon',
    method: 'stirred', glassware: 'Coupe or Nick & Nora', difficulty: 1,
    profile: { sweetness: 0.3, acid: 0.0, strength: 0.1, complexity: 0.6, season: 0.55, risk: 0.1 },
    occasion: 'Complex, boozy, after-dinner elegance. Rye gives it bite; bourbon rounds it out.',
    ingredients: [
      { name: 'Rye or Bourbon', amount: '2 oz', keywords: ['rye', 'bourbon', 'whiskey', 'whisky'], searchIn: ['whiskey'] },
      { name: 'Sweet Vermouth', amount: '1 oz', keywords: ['sweet vermouth', 'vermouth rosso', 'carpano', 'punt e mes', 'cocchi torino'], searchIn: ['fortified'] },
      { name: 'Angostura Bitters', amount: '2 dashes', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
    ],
    garnish: 'Luxardo cherry' },

  { id: 'rob-roy', name: 'Rob Roy', base: 'Scotch',
    method: 'stirred', glassware: 'Coupe', difficulty: 1,
    profile: { sweetness: 0.25, acid: 0.0, strength: 0.1, complexity: 0.65, season: 0.6, risk: 0.2 },
    occasion: 'A Manhattan rethought with Scotch — herbal, smoky potential, refined.',
    ingredients: [
      { name: 'Scotch', amount: '2 oz', keywords: ['scotch', 'whisky', 'islay', 'speyside', 'highland', 'blended'], searchIn: ['whiskey'] },
      { name: 'Sweet Vermouth', amount: '1 oz', keywords: ['sweet vermouth', 'vermouth rosso', 'carpano', 'punt e mes'], searchIn: ['fortified'] },
      { name: 'Angostura Bitters', amount: '2 dashes', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
    ],
    garnish: 'Lemon twist or cherry' },

  { id: 'vieux-carre', name: 'Vieux Carré', base: 'Rye + Cognac',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.25, acid: 0.0, strength: 0.1, complexity: 0.9, season: 0.6, risk: 0.5 },
    occasion: 'New Orleans classic. Six-ingredient complexity that rewards attention.',
    ingredients: [
      { name: 'Rye Whiskey', amount: '¾ oz', keywords: ['rye', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Cognac', amount: '¾ oz', keywords: ['cognac', 'armagnac', 'brandy'], searchIn: ['brandy'] },
      { name: 'Sweet Vermouth', amount: '¾ oz', keywords: ['sweet vermouth', 'vermouth rosso', 'carpano'], searchIn: ['fortified'] },
      { name: 'Angostura Bitters', amount: '1 dash', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
      { name: 'Bénédictine', amount: '1 tsp', keywords: ['benedictine', 'bénédictine'], searchIn: ['liqueurs_herbal'] },
      { name: 'Peychaud\'s Bitters', amount: '1 dash', keywords: ['peychaud', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
    ],
    garnish: 'Lemon twist' },

  { id: 'whiskey-sour', name: 'Whiskey Sour', base: 'Bourbon',
    method: 'shaken', glassware: 'Rocks or coupe', difficulty: 2,
    profile: { sweetness: 0.4, acid: 0.7, strength: 0.3, complexity: 0.3, season: 0.3, risk: 0.05 },
    occasion: 'Crowd-pleaser. Bright, citrusy, balanced. Egg white optional but elevates it.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'whiskey', 'rye'], searchIn: ['whiskey'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon', 'citrus'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'syrup', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Egg White', amount: '1 (optional)', keywords: ['egg'], searchIn: ['perishables'], optional: true },
    ],
    garnish: 'Orange slice and cherry' },

  { id: 'gold-rush', name: 'Gold Rush', base: 'Bourbon',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.65, strength: 0.25, complexity: 0.3, season: 0.4, risk: 0.15 },
    occasion: 'Bourbon sour rebooted with honey. Cleaner, more complex sweetness.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Honey Syrup', amount: '¾ oz', keywords: ['honey'], searchIn: ['syrups', 'pantry', 'perishables'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Lemon wheel' },

  { id: 'whiskey-smash', name: 'Whiskey Smash', base: 'Bourbon',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.5, strength: 0.25, complexity: 0.3, season: 0.2, risk: 0.1 },
    occasion: 'Summer-leaning, herbal, refreshing — but with backbone.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'syrup', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Fresh Mint', amount: '4–6 leaves', keywords: ['mint'], searchIn: ['produce', 'pantry'] },
    ],
    garnish: 'Mint bouquet, lemon slice' },

  { id: 'boulevardier', name: 'Boulevardier', base: 'Bourbon',
    method: 'stirred', glassware: 'Rocks or coupe', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.0, strength: 0.15, complexity: 0.7, season: 0.55, risk: 0.3 },
    occasion: 'Negroni\'s boozy American cousin. Bitter, complex, warming.',
    ingredients: [
      { name: 'Bourbon or Rye', amount: '1½ oz', keywords: ['bourbon', 'rye', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Campari', amount: '¾ oz', keywords: ['campari'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Sweet Vermouth', amount: '¾ oz', keywords: ['sweet vermouth', 'carpano', 'vermouth rosso'], searchIn: ['fortified'] },
    ],
    garnish: 'Orange twist or cherry' },

  { id: 'toronto', name: 'Toronto', base: 'Rye',
    method: 'stirred', glassware: 'Coupe', difficulty: 1,
    profile: { sweetness: 0.1, acid: 0.0, strength: 0.1, complexity: 0.75, season: 0.6, risk: 0.55 },
    occasion: 'Rye forward with a bitter herbal backbone. Underrated classic.',
    ingredients: [
      { name: 'Rye Whiskey', amount: '2 oz', keywords: ['rye', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Fernet-Branca', amount: '¼ oz', keywords: ['fernet', 'amaro'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Simple Syrup', amount: '¼ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Angostura Bitters', amount: '1 dash', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors'] },
    ],
    garnish: 'Orange twist' },

  { id: 'paper-plane', name: 'Paper Plane', base: 'Bourbon',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.55, strength: 0.35, complexity: 0.7, season: 0.4, risk: 0.6 },
    occasion: 'Equal parts modern classic. Bittersweet, tart, surprising complexity.',
    ingredients: [
      { name: 'Bourbon', amount: '¾ oz', keywords: ['bourbon', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Aperol', amount: '¾ oz', keywords: ['aperol'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Amaro Nonino', amount: '¾ oz', keywords: ['amaro', 'nonino', 'averna', 'ramazzotti'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'None, or lemon twist' },

  { id: 'new-york-sour', name: 'New York Sour', base: 'Bourbon',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.6, strength: 0.3, complexity: 0.5, season: 0.45, risk: 0.35 },
    occasion: 'Whiskey sour elevated with a dry red wine float. Visual drama.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'whiskey', 'rye'], searchIn: ['whiskey'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Dry Red Wine', amount: '½ oz float', keywords: ['red wine', 'wine'], searchIn: ['fortified', 'mixers'] },
    ],
    garnish: 'Lemon wheel, cherry' },

  { id: 'penicillin', name: 'Penicillin', base: 'Scotch',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.5, strength: 0.2, complexity: 0.85, season: 0.5, risk: 0.6 },
    occasion: 'Modern classic. Honey-ginger-lemon with a smoky Scotch float. Stunning.',
    ingredients: [
      { name: 'Blended Scotch', amount: '2 oz', keywords: ['scotch', 'whisky', 'blended'], searchIn: ['whiskey'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Honey-Ginger Syrup', amount: '¾ oz', keywords: ['honey', 'ginger', 'ginger syrup'], searchIn: ['syrups', 'pantry', 'perishables'] },
      { name: 'Islay Scotch (float)', amount: '¼ oz', keywords: ['islay', 'scotch', 'whisky', 'laphroaig', 'ardbeg', 'lagavulin'], searchIn: ['whiskey'], optional: true },
    ],
    garnish: 'Candied ginger, lemon wheel' },

  { id: 'brown-derby', name: 'Brown Derby', base: 'Bourbon',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.6, strength: 0.25, complexity: 0.4, season: 0.3, risk: 0.3 },
    occasion: 'Grapefruit and honey open up bourbon in unexpected ways.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Fresh Grapefruit Juice', amount: '1 oz', keywords: ['grapefruit'], searchIn: ['produce', 'perishables', 'mixers'] },
      { name: 'Honey Syrup', amount: '½ oz', keywords: ['honey'], searchIn: ['syrups', 'pantry', 'perishables'] },
    ],
    garnish: 'Grapefruit twist' },

  // ─── GIN ──────────────────────────────────────────────────────────

  { id: 'negroni', name: 'Negroni', base: 'Gin',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.0, strength: 0.2, complexity: 0.75, season: 0.5, risk: 0.2 },
    occasion: 'Bitter, herbal, complex. The aperitivo that became a religion.',
    ingredients: [
      { name: 'Gin', amount: '1 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Campari', amount: '1 oz', keywords: ['campari'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Sweet Vermouth', amount: '1 oz', keywords: ['sweet vermouth', 'carpano', 'vermouth rosso'], searchIn: ['fortified'] },
    ],
    garnish: 'Orange twist' },

  { id: 'gin-martini', name: 'Gin Martini', base: 'Gin',
    method: 'stirred', glassware: 'Martini glass', difficulty: 1,
    profile: { sweetness: 0.05, acid: 0.0, strength: 0.05, complexity: 0.4, season: 0.4, risk: 0.1 },
    occasion: 'The original sophisticated cocktail. Ratio and temperature are everything.',
    ingredients: [
      { name: 'Gin', amount: '2½ oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Dry Vermouth', amount: '½ oz', keywords: ['dry vermouth', 'vermouth dry', 'noilly prat', 'dolin'], searchIn: ['fortified'] },
    ],
    garnish: 'Lemon twist or olive' },

  { id: 'bee-knees', name: "Bee's Knees", base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.65, strength: 0.25, complexity: 0.35, season: 0.2, risk: 0.15 },
    occasion: 'Prohibition-era classic. Honey tames gin\'s botanicals; lemon brightens.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Honey Syrup', amount: '¾ oz', keywords: ['honey'], searchIn: ['syrups', 'pantry', 'perishables'] },
    ],
    garnish: 'Lemon twist' },

  { id: 'tom-collins', name: 'Tom Collins', base: 'Gin',
    method: 'built', glassware: 'Collins glass', difficulty: 1,
    profile: { sweetness: 0.35, acid: 0.55, strength: 0.55, complexity: 0.2, season: 0.05, risk: 0.05 },
    occasion: 'Long, refreshing, foolproof. The standard by which highballs are judged.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Fresh Lemon Juice', amount: '1 oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Soda Water', amount: '2–3 oz', keywords: ['soda', 'sparkling', 'club soda', 'seltzer'], searchIn: ['mixers'] },
    ],
    garnish: 'Lemon wheel, cherry' },

  { id: 'southside', name: 'Southside', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.6, strength: 0.3, complexity: 0.3, season: 0.1, risk: 0.15 },
    occasion: 'A gin mojito — fresh, herbal, bright. Chicago heritage.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Fresh Mint', amount: '6 leaves', keywords: ['mint'], searchIn: ['produce', 'pantry'] },
    ],
    garnish: 'Mint sprig' },

  { id: 'aviation', name: 'Aviation', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.5, strength: 0.3, complexity: 0.65, season: 0.3, risk: 0.5 },
    occasion: 'Floral, mysterious, otherworldly purple. The violet liqueur is non-negotiable.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Maraschino Liqueur', amount: '½ oz', keywords: ['maraschino', 'luxardo'], searchIn: ['liqueurs_fruit', 'liqueurs_specialty'] },
      { name: 'Crème de Violette', amount: '¼ oz', keywords: ['violette', 'crème de violette'], searchIn: ['liqueurs_specialty', 'liqueurs_fruit'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Brandied cherry' },

  { id: 'last-word', name: 'Last Word', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.55, strength: 0.35, complexity: 0.85, season: 0.35, risk: 0.7 },
    occasion: 'Equal-parts Prohibition legend. Herbal, maraschino, lime — bold, polarizing, perfect.',
    ingredients: [
      { name: 'Gin', amount: '¾ oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Green Chartreuse', amount: '¾ oz', keywords: ['chartreuse', 'green chartreuse'], searchIn: ['liqueurs_herbal'] },
      { name: 'Maraschino Liqueur', amount: '¾ oz', keywords: ['maraschino', 'luxardo'], searchIn: ['liqueurs_fruit', 'liqueurs_specialty'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Brandied cherry' },

  { id: 'french-75', name: 'French 75', base: 'Gin',
    method: 'shaken', glassware: 'Champagne flute', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.5, strength: 0.4, complexity: 0.4, season: 0.3, risk: 0.2 },
    occasion: 'Celebratory fizz. Gin lends botanicals that vodka can\'t.',
    ingredients: [
      { name: 'Gin', amount: '1½ oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Fresh Lemon Juice', amount: '½ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '½ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Champagne or Prosecco', amount: '2 oz', keywords: ['champagne', 'prosecco', 'sparkling', 'cava'], searchIn: ['fortified', 'mixers'] },
    ],
    garnish: 'Lemon twist' },

  { id: 'gimlet', name: 'Gimlet', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.65, strength: 0.25, complexity: 0.25, season: 0.2, risk: 0.1 },
    occasion: 'Simple, tart, gin-forward. Unbeatable with quality gin.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
    ],
    garnish: 'Lime wheel' },

  // ─── RUM ──────────────────────────────────────────────────────────

  { id: 'daiquiri', name: 'Daiquiri', base: 'White Rum',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.75, strength: 0.25, complexity: 0.2, season: 0.05, risk: 0.05 },
    occasion: 'The sour template. Clean, precise, unforgiving of bad ingredients.',
    ingredients: [
      { name: 'White Rum', amount: '2 oz', keywords: ['white rum', 'light rum', 'silver rum', 'blanco rum', 'cachaça', 'cachaca', 'rum'], searchIn: ['rum'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
    ],
    garnish: 'Lime wheel' },

  { id: 'mojito', name: 'Mojito', base: 'White Rum',
    method: 'built', glassware: 'Highball', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.55, strength: 0.5, complexity: 0.25, season: 0.05, risk: 0.05 },
    occasion: 'Herbal, refreshing, crowd-pleasing. The mint must be fresh.',
    ingredients: [
      { name: 'White Rum', amount: '2 oz', keywords: ['white rum', 'light rum', 'blanco', 'rum'], searchIn: ['rum'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Fresh Mint', amount: '8–10 leaves', keywords: ['mint'], searchIn: ['produce', 'pantry'] },
      { name: 'Soda Water', amount: '2 oz', keywords: ['soda', 'sparkling', 'club soda', 'seltzer'], searchIn: ['mixers'] },
    ],
    garnish: 'Mint bouquet, lime wheel' },

  { id: 'caipirinha', name: 'Caipirinha', base: 'Cachaça',
    method: 'built', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.3, acid: 0.7, strength: 0.2, complexity: 0.3, season: 0.1, risk: 0.25 },
    occasion: 'Brazil\'s national cocktail. Funky, tart, aggressively lime-forward.',
    ingredients: [
      { name: 'Cachaça', amount: '2 oz', keywords: ['cachaça', 'cachaca', 'cacha'], searchIn: ['rum'] },
      { name: 'Fresh Lime', amount: '1 whole, cut', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Sugar', amount: '2 tsp', keywords: ['sugar', 'simple', 'demerara'], searchIn: ['pantry', 'syrups'] },
    ],
    garnish: 'Lime wheel' },

  { id: 'jungle-bird', name: 'Jungle Bird', base: 'Dark Rum',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.35, acid: 0.5, strength: 0.3, complexity: 0.8, season: 0.2, risk: 0.65 },
    occasion: 'Bitter Campari meets funky dark rum and pineapple. Tiki with an edge.',
    ingredients: [
      { name: 'Dark Rum', amount: '1½ oz', keywords: ['dark rum', 'jamaican rum', 'aged rum', 'blackstrap', 'rum'], searchIn: ['rum'] },
      { name: 'Campari', amount: '¾ oz', keywords: ['campari'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Fresh Pineapple Juice', amount: '1½ oz', keywords: ['pineapple'], searchIn: ['perishables', 'mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '½ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
    ],
    garnish: 'Pineapple wedge' },

  { id: 'mai-tai', name: 'Mai Tai', base: 'Aged Rum',
    method: 'shaken', glassware: 'Rocks or tiki', difficulty: 2,
    profile: { sweetness: 0.4, acid: 0.5, strength: 0.3, complexity: 0.7, season: 0.1, risk: 0.4 },
    occasion: 'The definitive tiki cocktail. Nutty, citrus, rum-forward complexity.',
    ingredients: [
      { name: 'Aged Rum', amount: '2 oz', keywords: ['aged rum', 'dark rum', 'jamaican', 'rum'], searchIn: ['rum'] },
      { name: 'Orange Curaçao / Triple Sec', amount: '½ oz', keywords: ['cointreau', 'triple sec', 'curaçao', 'curacao', 'orange liqueur'], searchIn: ['liqueurs_fruit'] },
      { name: 'Orgeat', amount: '¼ oz', keywords: ['orgeat', 'almond'], searchIn: ['syrups'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Mint bouquet, lime shell' },

  { id: 'hemingway-daiquiri', name: 'Hemingway Daiquiri', base: 'White Rum',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.15, acid: 0.75, strength: 0.25, complexity: 0.55, season: 0.1, risk: 0.35 },
    occasion: 'Papa\'s drier, more complex daiquiri. Grapefruit and maraschino diverge beautifully.',
    ingredients: [
      { name: 'White Rum', amount: '2 oz', keywords: ['white rum', 'light rum', 'rum'], searchIn: ['rum'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Fresh Grapefruit Juice', amount: '¾ oz', keywords: ['grapefruit'], searchIn: ['produce', 'perishables', 'mixers'] },
      { name: 'Maraschino Liqueur', amount: '¼ oz', keywords: ['maraschino', 'luxardo'], searchIn: ['liqueurs_fruit', 'liqueurs_specialty'] },
    ],
    garnish: 'Lime wheel' },

  { id: 'cuba-libre', name: 'Cuba Libre', base: 'White Rum',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.55, acid: 0.35, strength: 0.6, complexity: 0.15, season: 0.15, risk: 0.0 },
    occasion: 'Rum and cola elevated by fresh lime. Humble but satisfying.',
    ingredients: [
      { name: 'White Rum', amount: '2 oz', keywords: ['rum', 'white rum', 'light rum'], searchIn: ['rum'] },
      { name: 'Cola', amount: '4 oz', keywords: ['cola', 'coke', 'pepsi'], searchIn: ['mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Lime wedge' },

  // ─── AGAVE ────────────────────────────────────────────────────────

  { id: 'margarita', name: 'Margarita', base: 'Tequila',
    method: 'shaken', glassware: 'Rocks or coupe', difficulty: 2,
    profile: { sweetness: 0.25, acid: 0.7, strength: 0.25, complexity: 0.25, season: 0.15, risk: 0.05 },
    occasion: 'The definitive tequila cocktail. Ratio and fresh citrus are everything.',
    ingredients: [
      { name: 'Tequila Blanco', amount: '2 oz', keywords: ['tequila', 'blanco', 'mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Orange Liqueur', amount: '1 oz', keywords: ['cointreau', 'triple sec', 'combier', 'curaçao', 'curacao', 'orange liqueur', 'grand marnier'], searchIn: ['liqueurs_fruit'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Salt rim, lime wheel' },

  { id: 'tommys-margarita', name: "Tommy's Margarita", base: 'Tequila',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.2, acid: 0.7, strength: 0.2, complexity: 0.3, season: 0.15, risk: 0.2 },
    occasion: 'Agave sweetens agave. The cleaner, spirit-forward margarita.',
    ingredients: [
      { name: 'Tequila Blanco', amount: '2 oz', keywords: ['tequila', 'blanco', 'mezcal'], searchIn: ['agave'] },
      { name: 'Fresh Lime Juice', amount: '1 oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Agave Syrup', amount: '½ oz', keywords: ['agave', 'agave syrup', 'agave nectar', 'simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
    ],
    garnish: 'Lime wheel, salt rim optional' },

  { id: 'mezcal-old-fashioned', name: 'Mezcal Old Fashioned', base: 'Mezcal',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.15, acid: 0.0, strength: 0.1, complexity: 0.65, season: 0.55, risk: 0.55 },
    occasion: 'Smoke, earth, and agave dressed in a classic structure. Deeply satisfying.',
    ingredients: [
      { name: 'Mezcal', amount: '2 oz', keywords: ['mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Simple Syrup', amount: '¼ oz', keywords: ['simple', 'sugar', 'agave'], searchIn: ['syrups', 'pantry'] },
      { name: 'Angostura Bitters', amount: '2 dashes', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
    ],
    garnish: 'Orange twist' },

  { id: 'mezcal-negroni', name: 'Mezcal Negroni', base: 'Mezcal',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.0, strength: 0.2, complexity: 0.8, season: 0.5, risk: 0.6 },
    occasion: 'The Negroni with smoke. Campari and mezcal fight beautifully.',
    ingredients: [
      { name: 'Mezcal', amount: '1 oz', keywords: ['mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Campari', amount: '1 oz', keywords: ['campari'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Sweet Vermouth', amount: '1 oz', keywords: ['sweet vermouth', 'carpano', 'vermouth rosso'], searchIn: ['fortified'] },
    ],
    garnish: 'Orange twist' },

  { id: 'naked-and-famous', name: 'Naked & Famous', base: 'Mezcal',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.5, strength: 0.3, complexity: 0.85, season: 0.3, risk: 0.75 },
    occasion: 'Equal-parts modern classic with mezcal. Aperol, Chartreuse, lime — wild but balanced.',
    ingredients: [
      { name: 'Mezcal', amount: '¾ oz', keywords: ['mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Aperol', amount: '¾ oz', keywords: ['aperol'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Yellow Chartreuse', amount: '¾ oz', keywords: ['chartreuse', 'yellow chartreuse'], searchIn: ['liqueurs_herbal'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'None' },

  { id: 'paloma', name: 'Paloma', base: 'Tequila',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.6, strength: 0.45, complexity: 0.25, season: 0.15, risk: 0.1 },
    occasion: 'Mexico\'s most popular cocktail. Grapefruit, salt, soda — effortless.',
    ingredients: [
      { name: 'Tequila Blanco', amount: '2 oz', keywords: ['tequila', 'mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Fresh Grapefruit Juice', amount: '2 oz', keywords: ['grapefruit'], searchIn: ['produce', 'perishables', 'mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Soda Water', amount: '1 oz', keywords: ['soda', 'sparkling', 'club soda'], searchIn: ['mixers'] },
    ],
    garnish: 'Salt rim, grapefruit wedge' },

  { id: 'oaxacan-old-fashioned', name: 'Oaxacan Old Fashioned', base: 'Mezcal + Reposado',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.15, acid: 0.0, strength: 0.1, complexity: 0.75, season: 0.55, risk: 0.6 },
    occasion: 'Phil Ward\'s Death & Co. masterpiece. Half mezcal, half reposado — architectural.',
    ingredients: [
      { name: 'Mezcal', amount: '1 oz', keywords: ['mezcal'], searchIn: ['agave'] },
      { name: 'Tequila Reposado', amount: '1 oz', keywords: ['reposado', 'tequila', 'agave'], searchIn: ['agave'] },
      { name: 'Agave Syrup', amount: '1 tsp', keywords: ['agave', 'agave syrup', 'simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Angostura or Mole Bitters', amount: '2 dashes', keywords: ['angostura', 'mole', 'bitters'], searchIn: ['bitters_anchors', 'bitters_nut', 'bitters_other'] },
    ],
    garnish: 'Flamed orange twist' },

  // ─── COGNAC / BRANDY ─────────────────────────────────────────────

  { id: 'sidecar', name: 'Sidecar', base: 'Cognac',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.55, strength: 0.2, complexity: 0.5, season: 0.45, risk: 0.2 },
    occasion: 'The cognac sour. Sugarcraft rim optional; Cointreau balance is mandatory.',
    ingredients: [
      { name: 'Cognac', amount: '2 oz', keywords: ['cognac', 'armagnac', 'brandy'], searchIn: ['brandy'] },
      { name: 'Orange Liqueur', amount: '¾ oz', keywords: ['cointreau', 'triple sec', 'curaçao', 'curacao', 'orange liqueur'], searchIn: ['liqueurs_fruit'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Sugared rim, lemon twist' },

  { id: 'cognac-old-fashioned', name: 'Cognac Old Fashioned', base: 'Cognac',
    method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.0, strength: 0.1, complexity: 0.6, season: 0.6, risk: 0.3 },
    occasion: 'Cognac\'s fruit and oak shine through the simplest structure.',
    ingredients: [
      { name: 'Cognac', amount: '2 oz', keywords: ['cognac', 'armagnac', 'brandy'], searchIn: ['brandy'] },
      { name: 'Simple Syrup', amount: '¼ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Angostura Bitters', amount: '2 dashes', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors', 'bitters_other'] },
    ],
    garnish: 'Orange twist' },

  { id: 'between-sheets', name: 'Between the Sheets', base: 'Cognac + Rum',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.5, strength: 0.2, complexity: 0.6, season: 0.35, risk: 0.45 },
    occasion: 'Two base spirits, one destination. Cognac and rum negotiate over Cointreau and lemon.',
    ingredients: [
      { name: 'Cognac', amount: '¾ oz', keywords: ['cognac', 'armagnac', 'brandy'], searchIn: ['brandy'] },
      { name: 'White Rum', amount: '¾ oz', keywords: ['white rum', 'light rum', 'rum'], searchIn: ['rum'] },
      { name: 'Orange Liqueur', amount: '¾ oz', keywords: ['cointreau', 'triple sec', 'orange liqueur'], searchIn: ['liqueurs_fruit'] },
      { name: 'Fresh Lemon Juice', amount: '¼ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Lemon twist' },

  // ─── VODKA ────────────────────────────────────────────────────────

  { id: 'moscow-mule', name: 'Moscow Mule', base: 'Vodka',
    method: 'built', glassware: 'Copper mug', difficulty: 1,
    profile: { sweetness: 0.25, acid: 0.5, strength: 0.55, complexity: 0.15, season: 0.2, risk: 0.05 },
    occasion: 'Spicy, refreshing, copper-served. Simple and consistently satisfying.',
    ingredients: [
      { name: 'Vodka', amount: '2 oz', keywords: ['vodka'], searchIn: ['white_spirits'] },
      { name: 'Ginger Beer', amount: '4 oz', keywords: ['ginger beer'], searchIn: ['mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Lime wedge, mint sprig' },

  { id: 'espresso-martini', name: 'Espresso Martini', base: 'Vodka',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.45, acid: 0.1, strength: 0.25, complexity: 0.5, season: 0.45, risk: 0.2 },
    occasion: 'The after-dinner crowd-pleaser. Three-bean foam is the target.',
    ingredients: [
      { name: 'Vodka', amount: '1½ oz', keywords: ['vodka'], searchIn: ['white_spirits'] },
      { name: 'Coffee Liqueur', amount: '¾ oz', keywords: ['kahlúa', 'kahlua', 'mr black', 'tia maria', 'coffee liqueur'], searchIn: ['liqueurs_nut'] },
      { name: 'Espresso', amount: '1 oz', keywords: ['espresso', 'coffee'], searchIn: ['perishables', 'pantry'] },
      { name: 'Simple Syrup', amount: '¼ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'], optional: true },
    ],
    garnish: 'Three coffee beans' },

  { id: 'cosmopolitan', name: 'Cosmopolitan', base: 'Vodka',
    method: 'shaken', glassware: 'Martini glass', difficulty: 2,
    profile: { sweetness: 0.4, acid: 0.5, strength: 0.3, complexity: 0.25, season: 0.25, risk: 0.05 },
    occasion: 'Pink, citrus, universally recognized. More respectable than its reputation.',
    ingredients: [
      { name: 'Vodka', amount: '1½ oz', keywords: ['vodka'], searchIn: ['white_spirits'] },
      { name: 'Orange Liqueur', amount: '¾ oz', keywords: ['cointreau', 'triple sec', 'orange liqueur'], searchIn: ['liqueurs_fruit'] },
      { name: 'Cranberry Juice', amount: '½ oz', keywords: ['cranberry'], searchIn: ['mixers', 'perishables'] },
      { name: 'Fresh Lime Juice', amount: '¼ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Flamed orange twist' },

  // ─── APERITIVO / VERMOUTH / FORTIFIED ────────────────────────────

  { id: 'americano', name: 'Americano', base: 'Campari + Sweet Vermouth',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.1, strength: 0.75, complexity: 0.5, season: 0.3, risk: 0.2 },
    occasion: 'The low-ABV bitter aperitivo. James Bond\'s gateway order.',
    ingredients: [
      { name: 'Campari', amount: '1 oz', keywords: ['campari'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Sweet Vermouth', amount: '1 oz', keywords: ['sweet vermouth', 'carpano', 'vermouth rosso'], searchIn: ['fortified'] },
      { name: 'Soda Water', amount: '2 oz', keywords: ['soda', 'sparkling', 'club soda'], searchIn: ['mixers'] },
    ],
    garnish: 'Orange slice' },

  { id: 'aperol-spritz', name: 'Aperol Spritz', base: 'Aperol',
    method: 'built', glassware: 'Wine glass', difficulty: 1,
    profile: { sweetness: 0.45, acid: 0.25, strength: 0.85, complexity: 0.2, season: 0.05, risk: 0.05 },
    occasion: 'The Italian aperitivo. Low-ABV, orange-bitter, universally drinkable.',
    ingredients: [
      { name: 'Aperol', amount: '2 oz', keywords: ['aperol'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Prosecco', amount: '3 oz', keywords: ['prosecco', 'champagne', 'sparkling wine', 'cava'], searchIn: ['fortified', 'mixers'] },
      { name: 'Soda Water', amount: '1 oz', keywords: ['soda', 'sparkling', 'club soda'], searchIn: ['mixers'] },
    ],
    garnish: 'Orange slice' },

  { id: 'adonis', name: 'Adonis', base: 'Sherry + Sweet Vermouth',
    method: 'stirred', glassware: 'Coupe', difficulty: 1,
    profile: { sweetness: 0.3, acid: 0.1, strength: 0.85, complexity: 0.65, season: 0.5, risk: 0.45 },
    occasion: 'No-spirit aperitivo of real sophistication. Sherry and vermouth in elegant conversation.',
    ingredients: [
      { name: 'Dry Sherry (Fino/Manzanilla)', amount: '2 oz', keywords: ['sherry', 'fino', 'manzanilla', 'amontillado', 'oloroso'], searchIn: ['fortified'] },
      { name: 'Sweet Vermouth', amount: '1 oz', keywords: ['sweet vermouth', 'carpano', 'vermouth rosso'], searchIn: ['fortified'] },
      { name: 'Orange Bitters', amount: '1 dash', keywords: ['orange bitters', 'angostura orange', 'regan'], searchIn: ['bitters_fruit', 'bitters_other'] },
    ],
    garnish: 'Orange twist' },

  { id: 'vermouth-cassis', name: 'Vermouth Cassis', base: 'Dry Vermouth',
    method: 'built', glassware: 'Wine glass', difficulty: 1,
    profile: { sweetness: 0.4, acid: 0.2, strength: 0.85, complexity: 0.3, season: 0.3, risk: 0.3 },
    occasion: 'Classic French café aperitif. Cassis and vermouth, long and low.',
    ingredients: [
      { name: 'Dry Vermouth', amount: '3 oz', keywords: ['dry vermouth', 'noilly prat', 'dolin dry'], searchIn: ['fortified'] },
      { name: 'Crème de Cassis', amount: '½ oz', keywords: ['cassis', 'crème de cassis', 'blackcurrant'], searchIn: ['liqueurs_fruit', 'liqueurs_specialty'] },
      { name: 'Soda Water', amount: '1 oz', keywords: ['soda', 'sparkling'], searchIn: ['mixers'] },
    ],
    garnish: 'Lemon twist' },

  // ─── WHISKEY HIGHBALLS & LONG DRINKS ─────────────────────────────

  { id: 'whiskey-highball', name: 'Japanese Whisky Highball', base: 'Japanese Whisky',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.05, acid: 0.05, strength: 0.55, complexity: 0.35, season: 0.35, risk: 0.2 },
    occasion: 'The Japanese art of the highball. Cold soda, precise pour, long stir.',
    ingredients: [
      { name: 'Japanese Whisky', amount: '1½ oz', keywords: ['japanese whisky', 'japanese whiskey', 'whisky', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Soda Water', amount: '4 oz', keywords: ['soda', 'sparkling', 'club soda'], searchIn: ['mixers'] },
    ],
    garnish: 'Lemon twist' },

  { id: 'dark-and-stormy', name: 'Dark & Stormy', base: 'Dark Rum',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.35, acid: 0.25, strength: 0.45, complexity: 0.3, season: 0.2, risk: 0.1 },
    occasion: 'The Bermuda prescription: Gosling\'s and ginger beer. Trademarked and delicious.',
    ingredients: [
      { name: 'Dark Rum', amount: '2 oz', keywords: ['dark rum', 'aged rum', 'jamaican', 'rum'], searchIn: ['rum'] },
      { name: 'Ginger Beer', amount: '4 oz', keywords: ['ginger beer'], searchIn: ['mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Lime wedge' },

  { id: 'horse-neck', name: "Horse's Neck", base: 'Bourbon',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.35, acid: 0.2, strength: 0.45, complexity: 0.25, season: 0.35, risk: 0.15 },
    occasion: 'Ginger beer meets bourbon. The long-peel garnish is half the point.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'rye', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Ginger Beer', amount: '4 oz', keywords: ['ginger beer'], searchIn: ['mixers'] },
      { name: 'Angostura Bitters', amount: '2 dashes', keywords: ['angostura', 'bitters'], searchIn: ['bitters_anchors'] },
    ],
    garnish: 'Long spiral lemon peel' },

  { id: 'kentucky-mule', name: 'Kentucky Mule', base: 'Bourbon',
    method: 'built', glassware: 'Copper mug', difficulty: 1,
    profile: { sweetness: 0.3, acid: 0.35, strength: 0.45, complexity: 0.2, season: 0.3, risk: 0.1 },
    occasion: 'Moscow Mule\'s bourbon-belt cousin. Warmer, more complex.',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz', keywords: ['bourbon', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Ginger Beer', amount: '4 oz', keywords: ['ginger beer'], searchIn: ['mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
    ],
    garnish: 'Lime wedge, mint' },

  // ─── SPECIALTY / COMPLEX ─────────────────────────────────────────

  { id: 'amaretto-sour', name: 'Amaretto Sour', base: 'Amaretto',
    method: 'shaken', glassware: 'Rocks glass', difficulty: 2,
    profile: { sweetness: 0.45, acid: 0.55, strength: 0.55, complexity: 0.4, season: 0.4, risk: 0.2 },
    occasion: 'Jeffrey Morgenthaler\'s revived version — bourbon floated over, egg white, genuinely good.',
    ingredients: [
      { name: 'Amaretto', amount: '1½ oz', keywords: ['amaretto', 'disaronno'], searchIn: ['liqueurs_nut', 'liqueurs_specialty'] },
      { name: 'Bourbon (float)', amount: '½ oz', keywords: ['bourbon', 'whiskey'], searchIn: ['whiskey'], optional: true },
      { name: 'Fresh Lemon Juice', amount: '1 oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Egg White', amount: '1 (optional)', keywords: ['egg'], searchIn: ['perishables'], optional: true },
    ],
    garnish: 'Angostura bitters, cherry' },

  { id: 'cynar-spritz', name: 'Cynar Spritz', base: 'Cynar',
    method: 'built', glassware: 'Wine glass', difficulty: 1,
    profile: { sweetness: 0.2, acid: 0.15, strength: 0.8, complexity: 0.55, season: 0.4, risk: 0.5 },
    occasion: 'Bitter artichoke amaro meets sparkling wine. Bolder, weirder, better than Aperol.',
    ingredients: [
      { name: 'Cynar', amount: '2 oz', keywords: ['cynar'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Prosecco', amount: '3 oz', keywords: ['prosecco', 'champagne', 'sparkling'], searchIn: ['fortified', 'mixers'] },
      { name: 'Soda Water', amount: '1 oz', keywords: ['soda', 'sparkling'], searchIn: ['mixers'] },
    ],
    garnish: 'Orange slice' },

  { id: 'corpse-reviver-2', name: 'Corpse Reviver #2', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.25, acid: 0.5, strength: 0.3, complexity: 0.75, season: 0.3, risk: 0.55 },
    occasion: 'The classic hangover cure. Four equal parts plus an absinthe rinse.',
    ingredients: [
      { name: 'Gin', amount: '¾ oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Cointreau / Triple Sec', amount: '¾ oz', keywords: ['cointreau', 'triple sec', 'orange liqueur'], searchIn: ['liqueurs_fruit'] },
      { name: 'Lillet Blanc / Cocchi Americano', amount: '¾ oz', keywords: ['lillet', 'cocchi', 'vermouth', 'blanc'], searchIn: ['fortified'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Absinthe (rinse)', amount: 'rinse', keywords: ['absinthe', 'pastis', 'herbsaint', 'pernod'], searchIn: ['other_spirits', 'liqueurs_herbal'], optional: true },
    ],
    garnish: 'Lemon twist' },

  { id: 'ramos-gin-fizz', name: 'Ramos Gin Fizz', base: 'Gin',
    method: 'shaken', glassware: 'Highball', difficulty: 3,
    profile: { sweetness: 0.45, acid: 0.4, strength: 0.45, complexity: 0.55, season: 0.25, risk: 0.4 },
    occasion: 'The ultimate brunch cocktail. 12-minute shake, cloud-like foam, New Orleans heritage.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Heavy Cream', amount: '2 oz', keywords: ['cream', 'heavy cream'], searchIn: ['perishables'] },
      { name: 'Fresh Lemon Juice', amount: '½ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '1 oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Egg White', amount: '1', keywords: ['egg'], searchIn: ['perishables'] },
      { name: 'Soda Water', amount: '1–2 oz', keywords: ['soda', 'sparkling'], searchIn: ['mixers'] },
    ],
    garnish: 'None' },

  { id: 'clover-club', name: 'Clover Club', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.4, acid: 0.6, strength: 0.3, complexity: 0.45, season: 0.2, risk: 0.3 },
    occasion: 'Pre-Prohibition pink. Raspberry, lemon, frothy egg white — unfairly overlooked.',
    ingredients: [
      { name: 'Gin', amount: '2 oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Raspberry Syrup', amount: '¾ oz', keywords: ['raspberry', 'raspberry syrup', 'chambord'], searchIn: ['syrups', 'liqueurs_fruit'] },
      { name: 'Egg White', amount: '1', keywords: ['egg'], searchIn: ['perishables'] },
    ],
    garnish: 'Three raspberries' },

  { id: 'stinger', name: 'Stinger', base: 'Cognac',
    method: 'stirred', glassware: 'Coupe', difficulty: 1,
    profile: { sweetness: 0.35, acid: 0.0, strength: 0.15, complexity: 0.4, season: 0.5, risk: 0.3 },
    occasion: 'Cognac cooled by white crème de menthe. Old-world, polarizing, elegant.',
    ingredients: [
      { name: 'Cognac', amount: '2 oz', keywords: ['cognac', 'armagnac', 'brandy'], searchIn: ['brandy'] },
      { name: 'White Crème de Menthe', amount: '¾ oz', keywords: ['crème de menthe', 'creme de menthe', 'menthe'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
    ],
    garnish: 'Mint sprig' },

  { id: 'white-lady', name: 'White Lady', base: 'Gin',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.25, acid: 0.55, strength: 0.25, complexity: 0.4, season: 0.3, risk: 0.25 },
    occasion: 'Cointreau bridges gin and lemon with class. The foam from egg white is essential.',
    ingredients: [
      { name: 'Gin', amount: '1½ oz', keywords: ['gin'], searchIn: ['white_spirits'] },
      { name: 'Cointreau / Triple Sec', amount: '¾ oz', keywords: ['cointreau', 'triple sec', 'orange liqueur'], searchIn: ['liqueurs_fruit'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Egg White', amount: '1', keywords: ['egg'], searchIn: ['perishables'] },
    ],
    garnish: 'Lemon twist' },

  { id: 'tequila-sunrise', name: 'Tequila Sunrise', base: 'Tequila',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.55, acid: 0.25, strength: 0.5, complexity: 0.15, season: 0.1, risk: 0.0 },
    occasion: 'Visual layering, festive, sweet. Good if you have the ingredients.',
    ingredients: [
      { name: 'Tequila Blanco', amount: '1½ oz', keywords: ['tequila', 'mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Orange Juice', amount: '4 oz', keywords: ['orange juice', 'oj'], searchIn: ['mixers', 'perishables'] },
      { name: 'Grenadine', amount: '¾ oz', keywords: ['grenadine', 'pomegranate'], searchIn: ['syrups'] },
    ],
    garnish: 'Orange slice, cherry' },

  { id: 'pisco-sour', name: 'Pisco Sour', base: 'Pisco',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.65, strength: 0.25, complexity: 0.45, season: 0.25, risk: 0.4 },
    occasion: 'Peru\'s signature. Grape spirit, frothy egg white, Angostura foam on top.',
    ingredients: [
      { name: 'Pisco', amount: '2 oz', keywords: ['pisco', 'brandy', 'cognac', 'armagnac'], searchIn: ['brandy'] },
      { name: 'Fresh Lime Juice', amount: '¾ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¾ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
      { name: 'Egg White', amount: '1', keywords: ['egg'], searchIn: ['perishables'] },
    ],
    garnish: 'Angostura bitters drops' },

  { id: 'scofflaw', name: 'Scofflaw', base: 'Rye',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.3, acid: 0.55, strength: 0.2, complexity: 0.6, season: 0.4, risk: 0.5 },
    occasion: 'Prohibition-era rye drink with dry vermouth and grenadine. Forgotten gem.',
    ingredients: [
      { name: 'Rye Whiskey', amount: '1½ oz', keywords: ['rye', 'bourbon', 'whiskey'], searchIn: ['whiskey'] },
      { name: 'Dry Vermouth', amount: '1 oz', keywords: ['dry vermouth', 'noilly prat', 'dolin'], searchIn: ['fortified'] },
      { name: 'Fresh Lemon Juice', amount: '¾ oz', keywords: ['lemon'], searchIn: ['produce', 'perishables'] },
      { name: 'Grenadine', amount: '¾ oz', keywords: ['grenadine'], searchIn: ['syrups'] },
    ],
    garnish: 'Orange twist' },

  { id: 'el-diablo', name: 'El Diablo', base: 'Tequila',
    method: 'built', glassware: 'Highball', difficulty: 1,
    profile: { sweetness: 0.4, acid: 0.35, strength: 0.45, complexity: 0.4, season: 0.2, risk: 0.35 },
    occasion: 'Tequila meets ginger beer and crème de cassis. Fruit, heat, smoke potential.',
    ingredients: [
      { name: 'Tequila Blanco', amount: '1½ oz', keywords: ['tequila', 'mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Crème de Cassis', amount: '½ oz', keywords: ['cassis', 'crème de cassis', 'blackcurrant'], searchIn: ['liqueurs_fruit', 'liqueurs_specialty'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Ginger Beer', amount: '3 oz', keywords: ['ginger beer'], searchIn: ['mixers'] },
    ],
    garnish: 'Lime wedge' },

  { id: 'siesta', name: 'Siesta', base: 'Tequila',
    method: 'shaken', glassware: 'Coupe', difficulty: 2,
    profile: { sweetness: 0.2, acid: 0.6, strength: 0.25, complexity: 0.65, season: 0.2, risk: 0.55 },
    occasion: 'Tequila, Campari, grapefruit, lime — bitter fruit complexity in one glass.',
    ingredients: [
      { name: 'Tequila Blanco', amount: '1½ oz', keywords: ['tequila', 'mezcal', 'agave'], searchIn: ['agave'] },
      { name: 'Campari', amount: '½ oz', keywords: ['campari'], searchIn: ['liqueurs_herbal', 'liqueurs_specialty'] },
      { name: 'Fresh Grapefruit Juice', amount: '¾ oz', keywords: ['grapefruit'], searchIn: ['produce', 'perishables', 'mixers'] },
      { name: 'Fresh Lime Juice', amount: '½ oz', keywords: ['lime'], searchIn: ['produce', 'perishables'] },
      { name: 'Simple Syrup', amount: '¼ oz', keywords: ['simple', 'sugar'], searchIn: ['syrups', 'pantry'] },
    ],
    garnish: 'Grapefruit twist' },

];
