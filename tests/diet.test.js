import { test } from "node:test";
import assert from "node:assert/strict";
import { factsFromOff, presetFacts, evaluate, blockedKeys, hasProfile } from "../src/diet.js";
import { PRODUCTS } from "../src/data/products.js";

const none = { allergies: [], diets: [] };

test("sans profil, aucune alerte", () => {
  const r = evaluate(presetFacts("jambon"), none);
  assert.deepEqual([r.danger, r.warn, r.good], [[], [], []]);
  assert.equal(hasProfile(none), false);
});

test("allergènes : contient et traces", () => {
  const facts = factsFromOff({ allergens_tags: ["en:milk", "en:gluten"], traces_tags: ["en:nuts", "en:milk"], ingredients_text_fr: "farine de blé, lait" });
  assert.deepEqual(facts.traces, ["nuts"], "une trace déjà présente comme allergène n'est pas répétée");
  const r = evaluate(facts, { allergies: ["milk", "nuts", "eggs"], diets: [] });
  assert.deepEqual(r.danger, ["Contient : lait"]);
  assert.deepEqual(r.warn, ["Traces possibles : fruits à coque"]);
});

test("halal : porc, alcool, gélatine, viande à vérifier, label", () => {
  const h = { allergies: [], diets: ["halal"] };
  assert.ok(evaluate(factsFromOff({ ingredients_text_fr: "Viande de porc, sel, dextrose" }), h).danger.includes("Contient du porc"));
  assert.ok(evaluate(factsFromOff({ ingredients_text_fr: "Crème, sucre, rhum 2%" }), h).danger.includes("Contient de l'alcool"));
  assert.ok(evaluate(factsFromOff({ ingredients_text_fr: "sucre, gélatine, arômes" }), h).warn.includes("Gélatine d'origine non précisée"));
  assert.ok(evaluate(factsFromOff({ ingredients_text_fr: "sucre, gélatine de porc" }), h).danger.includes("Contient du porc"));
  const poulet = evaluate(presetFacts("poulet"), h);
  assert.deepEqual(poulet.danger, []);
  assert.ok(poulet.warn[0].includes("certifiée halal"));
  const certifie = evaluate(factsFromOff({ ingredients_text_fr: "viande de poulet", labels_tags: ["en:halal"] }), h);
  assert.deepEqual(certifie.warn, []);
  assert.deepEqual(certifie.good, ["Certifié halal (selon l'étiquette)"]);
  // « vinaigre » ne doit pas être pris pour du vin.
  assert.ok(!factsFromOff({ ingredients_text_fr: "huile de colza, vinaigre, moutarde" }).contains.includes("alcohol"));
});

test("casher : fruits de mer et mélange viande-lait", () => {
  const k = { allergies: [], diets: ["kosher"] };
  assert.ok(evaluate(factsFromOff({ allergens_tags: ["en:crustaceans"], ingredients_text_fr: "crevettes" }), k).danger.includes("Contient des fruits de mer"));
  const mix = evaluate(factsFromOff({ allergens_tags: ["en:milk"], ingredients_text_fr: "poulet, crème" }), k);
  assert.ok(mix.warn.includes("Mélange viande et produit laitier"));
  assert.ok(evaluate(presetFacts("lardons"), k).danger.includes("Contient du porc"));
});

test("saucisses : porc possible, seulement un avertissement", () => {
  const r = evaluate(presetFacts("saucisses"), { allergies: [], diets: ["no_pork"] });
  assert.deepEqual(r.danger, []);
  assert.ok(r.warn[0].includes("souvent du porc"));
});

test("sans bœuf, végétarien, végan", () => {
  assert.ok(evaluate(presetFacts("boeuf_hache"), { allergies: [], diets: ["no_beef"] }).danger.includes("Contient du bœuf"));
  assert.ok(evaluate(factsFromOff({ ingredients_text_fr: "gélatine bovine" }), { allergies: [], diets: ["no_beef"] }).danger.includes("Contient du bœuf"));
  const veg = { allergies: [], diets: ["vegetarian"] };
  assert.ok(evaluate(presetFacts("saumon"), veg).danger.length);
  assert.deepEqual(evaluate(presetFacts("fromage"), veg).danger, []);
  const vegan = { allergies: [], diets: ["vegan"] };
  assert.ok(evaluate(presetFacts("fromage"), vegan).danger.includes("Contient du lait"));
  assert.ok(evaluate(factsFromOff({ ingredients_analysis_tags: ["en:vegan"], ingredients_text_fr: "pois chiches, sel" }), vegan).good.includes("Végan"));
});

test("ingrédients inconnus signalés", () => {
  const r = evaluate(factsFromOff({ product_name: "Mystère" }), { allergies: ["milk"], diets: [] });
  assert.equal(r.unknown, true);
  assert.equal(evaluate(presetFacts("carotte"), { allergies: ["milk"], diets: [] }).unknown, false);
  assert.equal(evaluate(presetFacts(null), { allergies: ["milk"], diets: [] }).unknown, true);
});

test("produits bloqués pour les recettes", () => {
  const keys = PRODUCTS.map(p => p.key);
  const halal = blockedKeys(keys, { allergies: [], diets: ["halal"] });
  assert.ok(halal.has("jambon") && halal.has("lardons") && halal.has("porc"));
  assert.ok(!halal.has("poulet") && !halal.has("saucisses"));
  const glu = blockedKeys(keys, { allergies: ["gluten"], diets: [] });
  assert.ok(glu.has("pain") && glu.has("pates") && !glu.has("riz"));
});
