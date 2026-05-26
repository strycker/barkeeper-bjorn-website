// Classroom static content — D-13 reference lessons (Techniques / Glassware / Ratios / Ingredients).
// Loads with NO API key present (AI-06). Grounded in 07-AI-SPEC §1b domain facts.
// Plain global const array (classics-db.js shape) — no fetch, no IIFE, read by classroom.js.

const CLASSROOM_CONTENT = [

  {
    topic: 'Techniques',
    lessons: [
      {
        title: 'Shake vs. Stir — when to do which',
        body: 'Shake any cocktail that contains citrus, egg, dairy, or another cloudy/viscous ingredient. Shaking aerates, chills hard, and integrates ingredients that will not blend by gentle motion alone. Stir any cocktail that is entirely clear and spirit-forward — Manhattan, Martini, Old Fashioned, Negroni. Stirring chills and dilutes without aerating, which keeps the drink silky and clear in the glass. A typical hard shake runs 12–15 seconds; a stir runs 20–30 seconds. Both methods aim for roughly 20–25% dilution by water at service.',
      },
      {
        title: 'The dry shake (and why egg drinks need it)',
        body: 'A dry shake is a shake without ice — usually 10–15 seconds — before the normal wet shake with ice. It is used for cocktails containing egg white (Whiskey Sour, Pisco Sour, Ramos Gin Fizz) to emulsify the protein and build a stable, dense foam crown. Add the egg white last to the tin, dry shake first, then add ice and shake again hard for another 10–15 seconds. Strain into a chilled coupe; the foam will settle into a thick cap. Without the dry shake the foam is thin and dies in seconds.',
      },
      {
        title: 'Building in the glass',
        body: 'Some cocktails are built directly in the serving glass — Old Fashioned, Negroni on the rocks, highballs like a Gin & Tonic. Add ingredients in order, add ice, and stir gently to integrate. Building skips the strainer and keeps prep minimal; it works for spirit-forward drinks that do not need vigorous chill or aeration. For a built Old Fashioned, muddle the sugar/bitters with a small splash of water first so the sugar fully dissolves before the whiskey hits.',
      },
    ],
  },

  {
    topic: 'Glassware',
    lessons: [
      {
        title: 'Coupe vs. Martini vs. Nick & Nora',
        body: 'Stemmed glassware (coupe, martini, Nick & Nora) is for drinks served "up" — chilled and strained, no ice in the glass. The stem keeps the hand off the bowl so the drink stays cold. The coupe is the most versatile (rounded bowl, ~5–7 oz) and works for almost anything served up: sours, daiquiris, Manhattans, gimlets. The Nick & Nora is a smaller (~5 oz), tulip-shaped cousin — elegant and harder to spill. The classic martini glass is wide and shallow; striking, but spills easily and warms fast.',
      },
      {
        title: 'Rocks (Old Fashioned) glasses',
        body: 'A rocks or "Old Fashioned" glass is short and wide (8–10 oz), built to hold a single large ice cube or several smaller cubes plus 2–3 oz of liquid. Use it for any spirit-forward drink served on ice: Old Fashioned, Negroni, whiskey neat with a side cube, mezcal sippers. A double rocks glass (12–14 oz) gives more headroom for a tall single cube or a longer pour. The wide opening lets aromatics escape, which is what you want for an aromatic spirit-forward sipper.',
      },
      {
        title: 'Highball, Collins, and other tall glasses',
        body: 'Highball glasses (10–12 oz) and Collins glasses (12–14 oz, taller and narrower) are for long drinks built over ice with a topper of soda, tonic, or ginger beer: Gin & Tonic, Tom Collins, Paloma, Dark & Stormy, Moscow Mule (the copper mug is the Mule variant). The narrow profile preserves carbonation longer than a wide glass. Always pre-chill or fill with ice first so the topper does not go flat on contact.',
      },
    ],
  },

  {
    topic: 'Ratios',
    lessons: [
      {
        title: 'The sour template — 2:1:1',
        body: 'A classic sour is built on a 2:1:1 ratio: 2 parts spirit, 1 part fresh citrus, 1 part sweetener. A Daiquiri is 2 oz white rum, 1 oz fresh lime, 1 oz simple syrup, shaken hard with ice and strained up. The same template gives you a Whiskey Sour (bourbon + lemon + simple, optional egg white), a Margarita (tequila + lime + Cointreau, where the Cointreau plays both sweetener and modifier), a Gimlet, a Sidecar. Tune the sweet/sour to taste — a stiffer drink might be 2:0.75:0.75. Always use fresh-squeezed citrus.',
      },
      {
        title: 'Equal parts — Negroni and the 1:1:1 family',
        body: 'The Negroni is 1:1:1 — equal parts gin, sweet vermouth, and Campari, stirred over ice and served on a big cube in a rocks glass with an orange peel. The same 1:1:1 idea drives the Boulevardier (bourbon swapped for gin), the Old Pal (rye + dry vermouth + Campari), and the Final Ward (rye + lemon + maraschino + green Chartreuse — equal parts shaken). Equal-parts drinks are easy to remember, easy to scale, and balanced when the three components are roughly equal in intensity.',
      },
      {
        title: 'Spirit-forward — the Old Fashioned ratio',
        body: 'An Old Fashioned is not a sour and not equal parts — it is overwhelmingly spirit, lightly sweetened and lightly bittered: 2 oz bourbon or rye, ¼ oz simple syrup (or one sugar cube), 2 dashes Angostura bitters, stirred with a large ice cube, expressed orange peel. The ratio of spirit to sweetener is roughly 8:1 by volume. The Manhattan sits between this and equal parts: 2 oz rye, 1 oz sweet vermouth, 2 dashes Angostura, stirred and strained up with a cherry. Spirit-forward drinks reward better spirits — what you put in is what you taste.',
      },
    ],
  },

  {
    topic: 'Ingredients',
    lessons: [
      {
        title: 'Flavor pairing — the bridge principle',
        body: 'Cocktails balance on contrast (sweet vs. sour, light vs. heavy) and on bridges — shared aromatic notes that link two ingredients. Bourbon and orange share vanilla and caramel notes (Old Fashioned). Gin and cucumber share a green, herbaceous register (Eastside, Pimm\'s Cup). Mezcal and grapefruit share a smoky-bitter rim (Naked & Famous, Paloma variants). When swapping a base spirit, look for one that shares at least one aromatic note with the modifier — that is usually a safe substitution.',
      },
      {
        title: 'Dilution and ice — the silent ingredient',
        body: 'A finished cocktail is roughly 20–25% water by volume. That water comes from melting ice during shake or stir, and it is essential — it softens the alcohol burn, opens up aromatics, and brings the drink to the right strength. Big clear cubes melt slowly and are right for spirit-forward drinks served on ice. Small/cracked ice melts fast and is right for shaken drinks where you want fast chill plus integrated dilution. Pebble or crushed ice is for swizzles and juleps where rapid dilution and visible frost are part of the experience.',
      },
      {
        title: 'Citrus — always fresh, always last-minute',
        body: 'Bottled lemon and lime juice taste flat, metallic, and slightly bitter — they have lost their volatile aromatics within hours of squeezing. Always squeeze citrus the same day you serve, ideally within an hour or two. One medium lemon yields roughly 1 oz of juice; one medium lime yields ¾–1 oz. Roll the fruit firmly on the counter before cutting to break the juice sacs. Strain the juice through a fine-mesh strainer if you want a polished texture; leave the pulp in for a more rustic, brighter mouthfeel.',
      },
    ],
  },

];
