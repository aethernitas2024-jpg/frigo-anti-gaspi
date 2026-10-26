import { test } from "node:test";
import assert from "node:assert/strict";
import { produceDaysLeft, produceExpiry, statesFor, defaultState, isRipening, isProduce } from "../src/produce.js";
import { byKey, guessKey } from "../src/data/products.js";

const T = "2026-10-12";

test("fruits qui mûrissent : l'état compte, pas la date d'achat", () => {
  assert.equal(produceDaysLeft({ key: "banane", base: 5, state: "pas_mur", purchased: T, today: T }), 9);
  assert.equal(produceDaysLeft({ key: "banane", base: 5, state: "mur", purchased: "2026-10-05", today: T }), 5);
  assert.equal(produceDaysLeft({ key: "banane", base: 5, state: "tres_mur", today: T }), 2);
  assert.equal(produceDaysLeft({ key: "avocat", base: 4, state: "abime", today: T }), 0);
  assert.equal(produceExpiry({ key: "tomate", base: 6, state: "pas_mur", today: T }), "2026-10-21");
});

test("légumes frais : la date d'achat réduit la durée restante", () => {
  assert.equal(produceDaysLeft({ key: "salade", base: 4, state: "frais", purchased: T, today: T }), 4);
  assert.equal(produceDaysLeft({ key: "salade", base: 4, state: "frais", purchased: "2026-10-10", today: T }), 2);
  assert.equal(produceDaysLeft({ key: "salade", base: 4, state: "frais", purchased: "2026-10-01", today: T }), 1, "jamais moins d'un jour pour un produit jugé frais");
  assert.equal(produceDaysLeft({ key: "carotte", base: 21, state: "fatigue", today: T }), 6);
});

test("états proposés selon le produit", () => {
  assert.equal(isRipening("banane"), true);
  assert.equal(isRipening("carotte"), false);
  assert.equal(statesFor("avocat")[0].id, "pas_mur");
  assert.equal(statesFor("salade")[0].id, "frais");
  assert.equal(defaultState("kiwi"), "mur");
  assert.equal(isProduce(byKey.pomme), true);
  assert.equal(isProduce(byKey.lait), false);
});

test("nouveaux fruits et légumes reconnus", () => {
  assert.equal(guessKey("Clémentines de Corse"), "orange");
  assert.equal(guessKey("Nectarines jaunes"), "peche");
  assert.equal(guessKey("Haricots verts extra-fins"), "haricot_vert");
  assert.equal(guessKey("Chou rouge"), "chou");
  assert.equal(guessKey("Choux de Bruxelles"), "chou");
});
