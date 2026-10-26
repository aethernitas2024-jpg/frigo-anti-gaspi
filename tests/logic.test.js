import { test } from "node:test";
import assert from "node:assert/strict";
import { daysLeft, addDays, bucketOf, leftLabel, rankRecipes, stats, canAdd, FREE_LIMIT, reminderFor, sortByExpiry } from "../src/logic.js";
import { RECIPES } from "../src/data/recipes.js";
import { PRODUCTS, byKey, guessKey, searchProducts } from "../src/data/products.js";

const T = "2026-10-12";

test("jours restants et ajout de jours", () => {
  assert.equal(daysLeft("2026-10-12", T), 0);
  assert.equal(daysLeft("2026-10-15", T), 3);
  assert.equal(daysLeft("2026-10-10", T), -2);
  assert.equal(addDays("2026-10-30", 3), "2026-11-02");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(daysLeft(null, T), null);
});

test("groupes et libellés d'urgence", () => {
  assert.equal(bucketOf(-1), "expired");
  assert.equal(bucketOf(0), "today");
  assert.equal(bucketOf(3), "soon");
  assert.equal(bucketOf(7), "week");
  assert.equal(bucketOf(8), "later");
  assert.equal(leftLabel(0), "Aujourd'hui");
  assert.equal(leftLabel(1), "Demain");
  assert.equal(leftLabel(-3), "Périmé depuis 3 j");
  assert.equal(leftLabel(12), "J-12");
});

test("chaque ingrédient de recette existe dans la base de produits", () => {
  for (const r of RECIPES) for (const k of [...r.need, ...r.extra]) {
    assert.ok(byKey[k], `clé inconnue « ${k} » dans la recette ${r.id}`);
  }
  assert.equal(new Set(RECIPES.map(r => r.id)).size, RECIPES.length, "identifiants de recettes en double");
  assert.equal(new Set(PRODUCTS.map(p => p.key)).size, PRODUCTS.length, "clés de produits en double");
});

test("reconnaissance des noms libres", () => {
  assert.equal(guessKey("Lait demi-écrémé bio"), "lait");
  assert.equal(guessKey("Pain de mie complet"), "pain_mie");
  assert.equal(guessKey("Baguette tradition"), "pain");
  assert.equal(guessKey("Pommes de terre"), "pomme_de_terre");
  assert.equal(guessKey("Pommes Golden"), "pomme");
  assert.equal(guessKey("Œufs plein air x6"), "oeufs");
  assert.equal(guessKey("Fromage blanc 0%"), "fromage_blanc");
  assert.equal(guessKey("Comté 18 mois"), "fromage");
  assert.equal(guessKey("Ailes de poulet"), "poulet");
  assert.equal(guessKey("Truc inconnu"), null);
  assert.equal(searchProducts("pom")[0].key, "pomme_de_terre");
});

test("les recettes privilégient ce qui périme bientôt", () => {
  const items = [
    { name: "Œufs", key: "oeufs", expiry: "2026-10-13" },
    { name: "Fromage râpé", key: "fromage_rape", expiry: "2026-10-30" },
    { name: "Pâtes", key: "pates", expiry: "2027-06-01" },
    { name: "Lardons", key: "lardons", expiry: "2026-10-13" },
    { name: "Lait périmé", key: "lait", expiry: "2026-10-01" }
  ];
  const ranked = rankRecipes(RECIPES, items, T);
  assert.ok(ranked.length > 0);
  const ids = ranked.map(r => r.recipe.id);
  assert.ok(ids.includes("omelette"));
  assert.ok(ids.includes("pates_carbo"));
  assert.ok(!ids.includes("pain_perdu"), "le lait périmé ne doit pas compter");
  assert.ok(ranked[0].urgentUsed.length > 0, "la première recette utilise un produit urgent");
  // Une recette sans ingrédient obligatoire exige son minimum de facultatifs.
  assert.ok(!ids.includes("smoothie"));
});

test("bilan du mois", () => {
  const h = [
    { outcome: "mange", date: "2026-10-02", price: 2 },
    { outcome: "mange", date: "2026-10-05", price: 3.5 },
    { outcome: "jete", date: "2026-10-06", price: 1.2 },
    { outcome: "mange", date: "2026-09-30", price: 9 }
  ];
  const s = stats(h, "2026-10-01", "2026-10-31");
  assert.deepEqual(s, { eaten: 2, thrown: 1, saved: 5.5, lost: 1.2, rate: 67 });
  assert.equal(stats([], "2026-10-01", "2026-10-31").rate, null);
});

test("limite de la version gratuite", () => {
  assert.equal(canAdd(FREE_LIMIT - 1, false), true);
  assert.equal(canAdd(FREE_LIMIT, false), false);
  assert.equal(canAdd(500, true), true);
});

test("texte du rappel quotidien", () => {
  const items = [
    { name: "Yaourts", expiry: "2026-10-13" },
    { name: "Poulet", expiry: "2026-10-12" },
    { name: "Riz", expiry: "2027-01-01" },
    { name: "Salade", expiry: "2026-10-11" }
  ];
  const r = reminderFor(items, T);
  assert.equal(r.count, 2);
  assert.ok(r.body.startsWith("Poulet, Yaourts"));
  assert.equal(reminderFor([{ name: "Riz", expiry: "2027-01-01" }], T), null);
  assert.equal(sortByExpiry(items)[0].name, "Salade");
});
