// Produits courants : durée de conservation habituelle une fois achetés (jours),
// emplacement conseillé et prix moyen indicatif (€) pour estimer les économies.
// `key` relie le produit aux ingrédients des recettes.

export const CATEGORIES = {
  laitier:  { label: "Produits laitiers", color: "#3D8BFF" },
  viande:   { label: "Viandes et poissons", color: "#E8505B" },
  legume:   { label: "Fruits et légumes", color: "#2BA55E" },
  traiteur: { label: "Traiteur", color: "#F29D38" },
  epicerie: { label: "Épicerie", color: "#A07A4F" },
  boisson:  { label: "Boissons", color: "#7C6CF0" },
  surgele:  { label: "Surgelés", color: "#36B3C9" },
  autre:    { label: "Autre", color: "#8A8F99" }
};

export const LOCATIONS = {
  frigo:   { label: "Frigo", short: "Frigo" },
  congel:  { label: "Congélateur", short: "Congél." },
  placard: { label: "Placard", short: "Placard" }
};

export const PRODUCTS = [
  // Produits laitiers
  { key: "lait", name: "Lait", emoji: "🥛", cat: "laitier", loc: "frigo", days: 4, price: 1.1 },
  { key: "yaourt", name: "Yaourts", emoji: "🥣", cat: "laitier", loc: "frigo", days: 14, price: 2.2 },
  { key: "creme", name: "Crème fraîche", emoji: "🥛", cat: "laitier", loc: "frigo", days: 10, price: 1.8 },
  { key: "beurre", name: "Beurre", emoji: "🧈", cat: "laitier", loc: "frigo", days: 30, price: 2.4 },
  { key: "fromage", name: "Fromage", emoji: "🧀", cat: "laitier", loc: "frigo", days: 14, price: 3.5 },
  { key: "fromage_rape", name: "Fromage râpé", emoji: "🧀", cat: "laitier", loc: "frigo", days: 10, price: 2.3 },
  { key: "mozzarella", name: "Mozzarella", emoji: "🧀", cat: "laitier", loc: "frigo", days: 7, price: 1.5 },
  { key: "oeufs", name: "Œufs", emoji: "🥚", cat: "laitier", loc: "frigo", days: 21, price: 3.0 },
  { key: "fromage_blanc", name: "Fromage blanc", emoji: "🥣", cat: "laitier", loc: "frigo", days: 10, price: 2.0 },
  // Viandes et poissons
  { key: "poulet", name: "Poulet", emoji: "🍗", cat: "viande", loc: "frigo", days: 3, price: 6.5 },
  { key: "boeuf_hache", name: "Bœuf haché", emoji: "🥩", cat: "viande", loc: "frigo", days: 2, price: 5.5 },
  { key: "jambon", name: "Jambon", emoji: "🥓", cat: "viande", loc: "frigo", days: 5, price: 2.8 },
  { key: "lardons", name: "Lardons", emoji: "🥓", cat: "viande", loc: "frigo", days: 10, price: 2.2 },
  { key: "saucisses", name: "Saucisses", emoji: "🌭", cat: "viande", loc: "frigo", days: 5, price: 4.0 },
  { key: "porc", name: "Porc", emoji: "🥩", cat: "viande", loc: "frigo", days: 3, price: 6.0 },
  { key: "poisson", name: "Poisson frais", emoji: "🐟", cat: "viande", loc: "frigo", days: 2, price: 8.0 },
  { key: "saumon", name: "Saumon", emoji: "🐟", cat: "viande", loc: "frigo", days: 3, price: 7.5 },
  { key: "thon", name: "Thon en boîte", emoji: "🥫", cat: "epicerie", loc: "placard", days: 730, price: 2.0 },
  // Fruits et légumes
  { key: "salade", name: "Salade", emoji: "🥬", cat: "legume", loc: "frigo", days: 4, price: 1.2 },
  { key: "tomate", name: "Tomates", emoji: "🍅", cat: "legume", loc: "frigo", days: 6, price: 2.5 },
  { key: "carotte", name: "Carottes", emoji: "🥕", cat: "legume", loc: "frigo", days: 21, price: 1.5 },
  { key: "courgette", name: "Courgettes", emoji: "🥒", cat: "legume", loc: "frigo", days: 7, price: 2.2 },
  { key: "poivron", name: "Poivrons", emoji: "🫑", cat: "legume", loc: "frigo", days: 8, price: 2.5 },
  { key: "champignon", name: "Champignons", emoji: "🍄", cat: "legume", loc: "frigo", days: 5, price: 2.2 },
  { key: "brocoli", name: "Brocoli", emoji: "🥦", cat: "legume", loc: "frigo", days: 5, price: 2.0 },
  { key: "epinard", name: "Épinards", emoji: "🥬", cat: "legume", loc: "frigo", days: 4, price: 2.0 },
  { key: "concombre", name: "Concombre", emoji: "🥒", cat: "legume", loc: "frigo", days: 7, price: 1.0 },
  { key: "aubergine", name: "Aubergine", emoji: "🍆", cat: "legume", loc: "frigo", days: 7, price: 1.8 },
  { key: "poireau", name: "Poireaux", emoji: "🥬", cat: "legume", loc: "frigo", days: 10, price: 2.0 },
  { key: "pomme_de_terre", name: "Pommes de terre", emoji: "🥔", cat: "legume", loc: "placard", days: 30, price: 2.0 },
  { key: "oignon", name: "Oignons", emoji: "🧅", cat: "legume", loc: "placard", days: 30, price: 1.5 },
  { key: "ail", name: "Ail", emoji: "🧄", cat: "legume", loc: "placard", days: 60, price: 1.0 },
  { key: "citron", name: "Citrons", emoji: "🍋", cat: "legume", loc: "frigo", days: 21, price: 1.8 },
  { key: "pomme", name: "Pommes", emoji: "🍎", cat: "legume", loc: "frigo", days: 30, price: 2.5 },
  { key: "banane", name: "Bananes", emoji: "🍌", cat: "legume", loc: "placard", days: 5, price: 1.9 },
  { key: "fraise", name: "Fraises", emoji: "🍓", cat: "legume", loc: "frigo", days: 3, price: 3.5 },
  { key: "avocat", name: "Avocats", emoji: "🥑", cat: "legume", loc: "placard", days: 4, price: 2.5 },
  { key: "herbes", name: "Herbes fraîches", emoji: "🌿", cat: "legume", loc: "frigo", days: 6, price: 1.3 },
  { key: "kiwi", name: "Kiwis", emoji: "🥝", cat: "legume", loc: "placard", days: 5, price: 2.5 },
  { key: "poire", name: "Poires", emoji: "🍐", cat: "legume", loc: "placard", days: 4, price: 2.8 },
  { key: "orange", name: "Oranges", emoji: "🍊", cat: "legume", loc: "placard", days: 14, price: 2.5 },
  { key: "raisin", name: "Raisin", emoji: "🍇", cat: "legume", loc: "frigo", days: 6, price: 3.0 },
  { key: "peche", name: "Pêches", emoji: "🍑", cat: "legume", loc: "placard", days: 3, price: 3.0 },
  { key: "mangue", name: "Mangue", emoji: "🥭", cat: "legume", loc: "placard", days: 4, price: 2.0 },
  { key: "melon", name: "Melon", emoji: "🍈", cat: "legume", loc: "placard", days: 3, price: 2.5 },
  { key: "haricot_vert", name: "Haricots verts", emoji: "🫛", cat: "legume", loc: "frigo", days: 5, price: 3.0 },
  { key: "chou", name: "Chou", emoji: "🥬", cat: "legume", loc: "frigo", days: 14, price: 2.0 },
  { key: "radis", name: "Radis", emoji: "🌱", cat: "legume", loc: "frigo", days: 5, price: 1.5 },
  // Traiteur et épicerie
  { key: "pain", name: "Pain", emoji: "🥖", cat: "epicerie", loc: "placard", days: 2, price: 1.2 },
  { key: "pain_mie", name: "Pain de mie", emoji: "🍞", cat: "epicerie", loc: "placard", days: 10, price: 2.0 },
  { key: "pates_fraiches", name: "Pâtes fraîches", emoji: "🍝", cat: "traiteur", loc: "frigo", days: 10, price: 2.2 },
  { key: "pate_feuilletee", name: "Pâte feuilletée", emoji: "🥧", cat: "traiteur", loc: "frigo", days: 14, price: 1.5 },
  { key: "pate_brisee", name: "Pâte brisée", emoji: "🥧", cat: "traiteur", loc: "frigo", days: 14, price: 1.5 },
  { key: "tortillas", name: "Tortillas", emoji: "🌯", cat: "epicerie", loc: "placard", days: 30, price: 2.0 },
  { key: "riz", name: "Riz", emoji: "🍚", cat: "epicerie", loc: "placard", days: 365, price: 1.8 },
  { key: "pates", name: "Pâtes", emoji: "🍝", cat: "epicerie", loc: "placard", days: 365, price: 1.2 },
  { key: "sauce_tomate", name: "Sauce tomate", emoji: "🥫", cat: "epicerie", loc: "placard", days: 365, price: 1.6 },
  { key: "reste", name: "Restes de repas", emoji: "🍲", cat: "traiteur", loc: "frigo", days: 3, price: 4.0 },
  { key: "jus", name: "Jus de fruits", emoji: "🧃", cat: "boisson", loc: "frigo", days: 7, price: 2.0 },
  // Surgelés
  { key: "legumes_surgeles", name: "Légumes surgelés", emoji: "🥦", cat: "surgele", loc: "congel", days: 180, price: 2.5 },
  { key: "glace", name: "Glace", emoji: "🍨", cat: "surgele", loc: "congel", days: 180, price: 4.0 }
];

export const DEFAULT_PRICE = 2.5;

export const byKey = Object.fromEntries(PRODUCTS.map(p => [p.key, p]));

// Retrouve le produit courant le plus proche d'un nom libre ("Lait demi-écrémé bio" → lait).
export function normalize(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").trim();
}
const ALIASES = {
  lait: ["lait"], yaourt: ["yaourt", "yogourt", "skyr"], creme: ["creme fraiche", "creme"], beurre: ["beurre"],
  fromage_rape: ["rape", "emmental rape"], mozzarella: ["mozzarella", "burrata"], fromage_blanc: ["fromage blanc", "faisselle"],
  fromage: ["fromage", "comte", "emmental", "camembert", "brie", "chevre", "gruyere", "raclette", "feta", "parmesan"],
  oeufs: ["oeuf"], poulet: ["poulet", "dinde", "volaille"], boeuf_hache: ["hache", "steak"], jambon: ["jambon"],
  lardons: ["lardon", "bacon"], saucisses: ["saucisse", "chipolata", "merguez", "knack"], porc: ["porc", "cote de porc", "filet mignon"],
  saumon: ["saumon"], thon: ["thon"], poisson: ["poisson", "cabillaud", "colin", "merlu", "crevette"],
  salade: ["salade", "laitue", "mache", "roquette"], tomate: ["tomate"], carotte: ["carotte"], courgette: ["courgette"],
  poivron: ["poivron"], champignon: ["champignon"], brocoli: ["brocoli", "chou-fleur", "chou fleur"], epinard: ["epinard"],
  concombre: ["concombre"], aubergine: ["aubergine"], poireau: ["poireau"], pomme_de_terre: ["pomme de terre", "pommes de terre", "patate"],
  oignon: ["oignon", "echalote"], ail: ["ail"], citron: ["citron"], pomme: ["pomme"], banane: ["banane"], fraise: ["fraise", "framboise", "myrtille"],
  avocat: ["avocat"], kiwi: ["kiwi"], poire: ["poire"], orange: ["orange", "clementine", "mandarine", "pamplemousse"],
  raisin: ["raisin"], peche: ["peche", "nectarine", "abricot", "prune"], mangue: ["mangue"], melon: ["melon", "pasteque"],
  haricot_vert: ["haricot vert", "haricots verts"], chou: ["chou", "choux", "chou rouge", "chou blanc"], radis: ["radis"],
  herbes: ["persil", "basilic", "coriandre", "ciboulette", "menthe"], pain_mie: ["pain de mie"], pain: ["pain", "baguette"],
  pates_fraiches: ["pates fraiches", "ravioli", "gnocchi", "tortellini"], pate_feuilletee: ["feuilletee"], pate_brisee: ["brisee"],
  tortillas: ["tortilla", "wrap"], riz: ["riz"], pates: ["pates", "spaghetti", "penne", "coquillette"], sauce_tomate: ["sauce tomate", "coulis"],
  jus: ["jus"], legumes_surgeles: ["surgele"], glace: ["glace", "sorbet"]
};
// Ordre : les alias les plus longs d'abord, pour que "pain de mie" passe avant "pain".
const ALIAS_LIST = Object.entries(ALIASES)
  .flatMap(([key, words]) => words.map(w => [w, key]))
  .sort((a, b) => b[0].length - a[0].length);

export function guessKey(name) {
  const n = normalize(name);
  if (!n) return null;
  for (const [w, key] of ALIAS_LIST) {
    const re = new RegExp("(^|[^a-z])" + w.replace(/[-]/g, "[- ]") + "s?([^a-z]|$)");
    if (re.test(n)) return key;
  }
  return null;
}

// Recherche pour l'écran d'ajout : préfixe puis contenu.
export function searchProducts(q) {
  const n = normalize(q);
  if (!n) return PRODUCTS;
  const starts = PRODUCTS.filter(p => normalize(p.name).startsWith(n));
  const contains = PRODUCTS.filter(p => !starts.includes(p) && normalize(p.name).includes(n));
  return [...starts, ...contains];
}
