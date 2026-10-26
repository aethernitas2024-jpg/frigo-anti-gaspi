// Profil alimentaire : allergènes et régimes (religieux ou choisis).
// Logique pure, testée dans tests/diet.test.js.
//
// Un produit est décrit par des « faits » neutres (ce qu'il contient d'après
// Open Food Facts ou d'après la base de produits courants) ; evaluate() les
// compare au profil de la personne. Une absence d'alerte ne garantit rien :
// quand les ingrédients sont inconnus, on le dit.

// Les 14 allergènes à déclaration obligatoire en Europe.
export const ALLERGENS = [
  { id: "gluten", label: "Gluten", off: ["en:gluten"] },
  { id: "milk", label: "Lait", off: ["en:milk"] },
  { id: "eggs", label: "Œufs", off: ["en:eggs"] },
  { id: "peanuts", label: "Arachides", off: ["en:peanuts"] },
  { id: "nuts", label: "Fruits à coque", off: ["en:nuts"] },
  { id: "fish", label: "Poisson", off: ["en:fish"] },
  { id: "crustaceans", label: "Crustacés", off: ["en:crustaceans"] },
  { id: "molluscs", label: "Mollusques", off: ["en:molluscs"] },
  { id: "soy", label: "Soja", off: ["en:soybeans"] },
  { id: "sesame", label: "Sésame", off: ["en:sesame-seeds"] },
  { id: "celery", label: "Céleri", off: ["en:celery"] },
  { id: "mustard", label: "Moutarde", off: ["en:mustard"] },
  { id: "sulphites", label: "Sulfites", off: ["en:sulphur-dioxide-and-sulphites"] },
  { id: "lupin", label: "Lupin", off: ["en:lupin"] }
];
const ALLERGEN_BY_OFF = Object.fromEntries(ALLERGENS.flatMap(a => a.off.map(t => [t, a.id])));
export const allergenLabel = id => (ALLERGENS.find(a => a.id === id) || { label: id }).label;

export const DIETS = [
  { id: "halal", label: "Halal", hint: "Sans porc ni alcool ; viande à vérifier" },
  { id: "kosher", label: "Casher", hint: "Sans porc ni fruits de mer ; viande à vérifier" },
  { id: "no_pork", label: "Sans porc", hint: "Porc, lard, gélatine de porc" },
  { id: "no_beef", label: "Sans bœuf", hint: "Par exemple dans l'hindouisme" },
  { id: "vegetarian", label: "Végétarien", hint: "Sans viande ni poisson" },
  { id: "vegan", label: "Végan", hint: "Aucun produit animal" },
  { id: "no_alcohol", label: "Sans alcool", hint: "Alcool dans les ingrédients" }
];

// Faits connus pour les produits courants (clés de products.js).
const MILK = { allergens: ["milk"], contains: ["dairy"] };
const PRESET_FACTS = {
  lait: MILK, yaourt: MILK, creme: MILK, beurre: MILK, fromage: MILK, fromage_rape: MILK, mozzarella: MILK, fromage_blanc: MILK,
  glace: { allergens: ["milk"], traces: ["eggs", "nuts"], contains: ["dairy"] },
  oeufs: { allergens: ["eggs"], contains: ["eggs"] },
  poulet: { contains: ["meat"] },
  boeuf_hache: { contains: ["meat", "beef"] },
  jambon: { contains: ["meat", "pork"] },
  lardons: { contains: ["meat", "pork"] },
  porc: { contains: ["meat", "pork"] },
  saucisses: { contains: ["meat", "maybe_pork"] },
  poisson: { allergens: ["fish"], contains: ["fish"] },
  saumon: { allergens: ["fish"], contains: ["fish"] },
  thon: { allergens: ["fish"], contains: ["fish"] },
  pain: { allergens: ["gluten"] },
  pain_mie: { allergens: ["gluten"], traces: ["milk", "sesame"] },
  pates: { allergens: ["gluten"] },
  pates_fraiches: { allergens: ["gluten", "eggs"], contains: ["eggs"] },
  pate_feuilletee: { allergens: ["gluten"], traces: ["milk"] },
  pate_brisee: { allergens: ["gluten"], traces: ["milk"] },
  tortillas: { allergens: ["gluten"] },
  reste: null
};
// Produits courants sans allergène ni ingrédient sensible (fruits, légumes, riz…).
const PLAIN = new Set(["salade", "tomate", "carotte", "courgette", "poivron", "champignon", "brocoli", "epinard", "concombre",
  "aubergine", "poireau", "pomme_de_terre", "oignon", "ail", "citron", "pomme", "banane", "fraise", "avocat", "herbes",
  "riz", "sauce_tomate", "jus", "legumes_surgeles", "kiwi", "poire", "orange", "raisin", "peche", "mangue", "melon",
  "haricot_vert", "chou", "radis"]);

function emptyFacts(known) {
  return { allergens: [], traces: [], contains: [], labels: [], analysis: [], known };
}
export function presetFacts(key) {
  if (!key) return emptyFacts(false);
  if (PLAIN.has(key)) return emptyFacts(true);
  const f = PRESET_FACTS[key];
  if (!f) return emptyFacts(false);
  return { ...emptyFacts(true), ...f, generic: true };
}

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe");
const word = re => new RegExp("(^|[^a-z])(" + re + ")([^a-z]|$)");
const TEXT_RULES = [
  ["pork", word("porc|jambon|lardons?|saindoux|bacon|chorizo|pancetta|coppa|rillettes de porc|graisse de porc")],
  ["gelatin_pork", /gelatine (de porc|porcine)/],
  ["gelatin_beef", /gelatine (de boeuf|bovine)/],
  ["gelatin", word("gelatine|e ?441")],
  ["beef", word("boeuf|bovin|veau")],
  ["meat", word("viande|poulet|dinde|volaille|agneau|mouton|canard|lapin|boeuf|porc|jambon|veau")],
  ["fish", word("poisson|saumon|thon|cabillaud|anchois|sardine")],
  ["alcohol", word("alcool|vin|rhum|biere|cognac|calvados|liqueur|whisky|vodka|kirsch|armagnac|porto|marsala|cidre")],
  ["carmine", word("carmin|e ?120|cochenille")],
  ["honey", word("miel")]
];
const TAG_RULES = {
  pork: ["en:pork", "en:pork-meat", "en:ham", "en:bacon", "en:lard", "en:pork-fat", "en:pork-rind"],
  gelatin_pork: ["en:pork-gelatin"],
  gelatin_beef: ["en:beef-gelatin"],
  gelatin: ["en:gelatin", "en:gelatine"],
  beef: ["en:beef", "en:beef-meat", "en:beef-fat", "en:veal"],
  meat: ["en:meat", "en:chicken", "en:chicken-meat", "en:turkey", "en:poultry"],
  alcohol: ["en:alcohol", "en:ethanol", "en:wine", "en:beer", "en:rum", "en:spirit", "en:liqueur"],
  carmine: ["en:e120", "en:carmine", "en:cochineal"],
  honey: ["en:honey"]
};

// Faits à partir d'une fiche Open Food Facts.
export function factsFromOff(p) {
  const allergens = [...new Set((p.allergens_tags || []).map(t => ALLERGEN_BY_OFF[t]).filter(Boolean))];
  const traces = [...new Set((p.traces_tags || []).map(t => ALLERGEN_BY_OFF[t]).filter(Boolean))].filter(a => !allergens.includes(a));
  const tags = new Set(p.ingredients_tags || []);
  const text = norm(p.ingredients_text_fr || p.ingredients_text || "");
  const contains = new Set();
  for (const [k, list] of Object.entries(TAG_RULES)) if (list.some(t => tags.has(t))) contains.add(k);
  for (const [k, re] of TEXT_RULES) if (re.test(text)) contains.add(k);
  if (contains.has("gelatin_pork")) { contains.add("pork"); contains.add("gelatin"); }
  if (contains.has("gelatin_beef")) { contains.add("beef"); contains.add("gelatin"); }
  if (contains.has("pork") || contains.has("beef")) contains.add("meat");
  if (allergens.includes("milk")) contains.add("dairy");
  if (allergens.includes("eggs")) contains.add("eggs");
  if (allergens.includes("fish")) contains.add("fish");
  if (allergens.includes("crustaceans") || allergens.includes("molluscs")) contains.add("shellfish");
  if ((p.categories_tags || []).some(t => t === "en:alcoholic-beverages" || t === "en:wines" || t === "en:beers")) contains.add("alcohol");
  const labels = (p.labels_tags || []).map(t => ({ "en:halal": "halal", "en:kosher": "kosher", "en:vegan": "vegan", "en:vegetarian": "vegetarian" })[t]).filter(Boolean);
  const analysis = (p.ingredients_analysis_tags || []).filter(t => /vegan|vegetarian/.test(t)).map(t => t.replace("en:", ""));
  const known = !!(text || tags.size || (p.allergens_tags || []).length);
  return { allergens, traces, contains: [...contains], labels, analysis, known };
}

// Compare les faits au profil. Résultat : alertes rouges (danger), orange (à vérifier), vertes (bon signe).
export function evaluate(facts, profile) {
  const allergies = profile.allergies || [], diets = profile.diets || [];
  const out = { danger: [], warn: [], good: [], unknown: false };
  if (!allergies.length && !diets.length) return out;
  const f = facts || emptyFacts(false);
  const has = k => f.contains.includes(k);
  const label = k => f.labels.includes(k);
  const add = (list, text) => { if (!out[list].includes(text)) out[list].push(text); };

  for (const a of allergies) {
    if (f.allergens.includes(a)) add("danger", "Contient : " + allergenLabel(a).toLowerCase());
    else if (f.traces.includes(a)) add("warn", "Traces possibles : " + allergenLabel(a).toLowerCase());
  }
  const meatNotice = (certif, name) => {
    if (has("meat") && !has("pork") && !label(certif)) add("warn", "Viande : vérifiez qu'elle est certifiée " + name);
  };
  for (const d of diets) {
    if (d === "halal" || d === "kosher" || d === "no_pork") {
      if (has("pork")) add("danger", "Contient du porc");
      else if (has("maybe_pork")) add("warn", "Contient souvent du porc : vérifiez l'emballage");
      if (has("gelatin") && !has("gelatin_pork") && !has("gelatin_beef")) add("warn", "Gélatine d'origine non précisée");
    }
    if (d === "halal") {
      if (has("alcohol")) add("danger", "Contient de l'alcool");
      if (has("carmine")) add("warn", "Contient du carmin (E120), d'origine animale");
      meatNotice("halal", "halal");
      if (label("halal")) add("good", "Certifié halal (selon l'étiquette)");
    }
    if (d === "kosher") {
      if (has("shellfish")) add("danger", "Contient des fruits de mer");
      if (has("meat") && has("dairy")) add("warn", "Mélange viande et produit laitier");
      meatNotice("kosher", "casher");
      if (label("kosher")) add("good", "Certifié casher (selon l'étiquette)");
    }
    if (d === "no_beef") {
      if (has("beef")) add("danger", "Contient du bœuf");
      else if (has("gelatin")) add("warn", "Gélatine d'origine non précisée");
    }
    if (d === "no_alcohol" && has("alcohol")) add("danger", "Contient de l'alcool");
    if (d === "vegetarian" || d === "vegan") {
      if (has("meat") || has("pork") || has("beef")) add("danger", "Contient de la viande");
      if (has("fish") || has("shellfish")) add("danger", "Contient du poisson ou des fruits de mer");
      if (has("gelatin")) add("danger", "Contient de la gélatine (animale)");
      if (has("carmine")) add("danger", "Contient du carmin (E120), d'origine animale");
      if (has("maybe_pork")) add("danger", "Contient de la viande");
      if (f.analysis.includes("non-vegetarian")) add("danger", "Non végétarien selon Open Food Facts");
    }
    if (d === "vegan") {
      if (has("dairy")) add("danger", "Contient du lait");
      if (has("eggs")) add("danger", "Contient des œufs");
      if (has("honey")) add("danger", "Contient du miel");
      if (f.analysis.includes("non-vegan")) add("danger", "Non végan selon Open Food Facts");
      else if (f.analysis.includes("maybe-vegan")) add("warn", "Peut-être végan : vérifiez l'emballage");
      if (label("vegan") || f.analysis.includes("vegan")) add("good", "Végan");
    }
    if (d === "vegetarian" && (label("vegetarian") || f.analysis.includes("vegetarian"))) add("good", "Végétarien");
  }
  if (out.danger.length) out.good = [];
  out.unknown = !f.known;
  return out;
}

export const hasProfile = profile => !!((profile.allergies || []).length || (profile.diets || []).length);

// Clés de produits courants incompatibles avec le profil (pour filtrer les recettes).
export function blockedKeys(keys, profile) {
  return new Set(keys.filter(k => evaluate(presetFacts(k), profile).danger.length));
}
