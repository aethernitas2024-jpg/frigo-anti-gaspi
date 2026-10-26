// Logique pure (sans interface) : dates, urgences, recettes, bilan, limites Pro.
// Testée dans tests/logic.test.js.

export const FREE_LIMIT = 40;

const pad = n => String(n).padStart(2, "0");
export const isoOf = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
export function daysLeft(expiry, today) {
  const d = parseISO(expiry), t = parseISO(today);
  if (!d || !t) return null;
  return Math.round((d - t) / 86400000);
}

// Groupes affichés dans le stock, du plus urgent au moins urgent.
export const BUCKETS = [
  { id: "expired", label: "Périmé", test: n => n < 0 },
  { id: "today", label: "À manger aujourd'hui", test: n => n === 0 },
  { id: "soon", label: "Dans 1 à 3 jours", test: n => n >= 1 && n <= 3 },
  { id: "week", label: "Cette semaine", test: n => n >= 4 && n <= 7 },
  { id: "later", label: "Plus tard", test: n => n > 7 }
];
export function bucketOf(n) {
  if (n == null) return "later";
  return BUCKETS.find(b => b.test(n)).id;
}
export function urgency(n) {
  if (n == null) return "ok";
  if (n < 0) return "expired";
  if (n <= 1) return "urgent";
  if (n <= 3) return "soon";
  return "ok";
}
export function leftLabel(n) {
  if (n == null) return "";
  if (n < -1) return "Périmé depuis " + (-n) + " j";
  if (n === -1) return "Périmé hier";
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return "Demain";
  if (n <= 30) return "J-" + n;
  if (n < 365) return Math.round(n / 30) + " mois";
  return "+ d'1 an";
}

export function sortByExpiry(items) {
  return [...items].sort((a, b) => (a.expiry || "9999").localeCompare(b.expiry || "9999") || a.name.localeCompare(b.name, "fr"));
}

// Recettes : score selon les ingrédients présents, en favorisant ceux qui périment bientôt.
export function weightOf(n) {
  if (n == null) return 1;
  if (n < 0) return 0;          // périmé : on ne le propose pas en cuisine
  if (n <= 2) return 4;
  if (n <= 5) return 2;
  return 1;
}
export function rankRecipes(recipes, items, today) {
  const best = {};
  for (const it of items) {
    if (!it.key) continue;
    const w = weightOf(daysLeft(it.expiry, today));
    if (w === 0) continue;
    if (!best[it.key] || w > best[it.key].w) best[it.key] = { w, item: it };
  }
  const out = [];
  for (const r of recipes) {
    const needHave = r.need.filter(k => best[k]);
    if (needHave.length < r.need.length) continue;
    const extraHave = r.extra.filter(k => best[k]);
    if (extraHave.length < (r.minExtra || 0)) continue;
    if (!needHave.length && !extraHave.length) continue;
    const used = [...needHave, ...extraHave];
    const score = used.reduce((s, k) => s + best[k].w, 0) * 10 + needHave.length * 3 - r.time / 30;
    const urgentUsed = used.filter(k => best[k].w >= 4).map(k => best[k].item);
    out.push({ recipe: r, have: used, urgentUsed, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

// Bilan : consommés vs jetés sur une période, économies estimées.
export function stats(history, fromISO, toISO) {
  const rows = history.filter(h => h.date >= fromISO && h.date <= toISO);
  const eaten = rows.filter(h => h.outcome === "mange");
  const thrown = rows.filter(h => h.outcome === "jete");
  const sum = arr => Math.round(arr.reduce((s, h) => s + (Number(h.price) || 0), 0) * 100) / 100;
  const total = eaten.length + thrown.length;
  return {
    eaten: eaten.length, thrown: thrown.length,
    saved: sum(eaten), lost: sum(thrown),
    rate: total ? Math.round(100 * eaten.length / total) : null
  };
}

export function canAdd(activeCount, isPro) {
  return isPro || activeCount < FREE_LIMIT;
}

// Résumé d'une journée pour la notification de rappel.
export function reminderFor(items, dayISO) {
  const soon = items
    .map(it => ({ it, n: daysLeft(it.expiry, dayISO) }))
    .filter(x => x.n != null && x.n >= 0 && x.n <= 1)
    .sort((a, b) => a.n - b.n);
  if (!soon.length) return null;
  const names = soon.slice(0, 3).map(x => x.it.name);
  const more = soon.length > 3 ? " et " + (soon.length - 3) + " autre" + (soon.length - 3 > 1 ? "s" : "") : "";
  const title = soon.length === 1 ? "1 produit à consommer vite" : soon.length + " produits à consommer vite";
  return { title, body: names.join(", ") + more + ". Une idée de recette vous attend.", count: soon.length };
}
