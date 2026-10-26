import "./style.css";
import { App } from "@capacitor/app";
import { PRODUCTS, CATEGORIES, LOCATIONS, byKey, guessKey, searchProducts, DEFAULT_PRICE } from "./data/products.js";
import { RECIPES } from "./data/recipes.js";
import { isoOf, addDays, daysLeft, BUCKETS, bucketOf, urgency, leftLabel, sortByExpiry, rankRecipes, stats, canAdd, FREE_LIMIT } from "./logic.js";
import { native, loadState, saveState, scheduleReminders, askNotifications, notificationsAllowed, onReminderTap, scanBarcode, lookupBarcode } from "./services.js";
import { isPro, buyPro, restorePro, setDevPro } from "./pro.js";
import { ALLERGENS, DIETS, presetFacts, evaluate, hasProfile, blockedKeys } from "./diet.js";
import { isProduce, statesFor, defaultState, produceExpiry, produceDaysLeft, stateTip } from "./produce.js";

/* ---------- utilitaires d'interface ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; el.append(c.nodeType ? c : String(c)); }
  return el;
}
const sv = p => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
const I = {
  fridge: sv('<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M5 10h14M8.5 6v1.5M8.5 13v3"/>'),
  book: sv('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/>'),
  cart: sv('<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 3h2.5l2.2 11.2a1.5 1.5 0 0 0 1.5 1.3h7.9a1.5 1.5 0 0 0 1.5-1.2L20 7H6.2"/>'),
  chart: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  scan: sv('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10.5 8v8M14 8v8M17 8v8"/>'),
  check: sv('<path d="m5 12 5 5 9-10"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  trash: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  snow: sv('<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>'),
  back: sv('<path d="m15 18-6-6 6-6"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  lock: sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  alert: sv('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>')
};

const today = () => isoOf(new Date());
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const euro = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const fmtDate = (iso, o) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("fr-FR", o || { weekday: "short", day: "numeric", month: "short" }); };
const plural = (n, one, many) => n + " " + (n > 1 ? (many || one + "s") : one);

/* ---------- état ---------- */
const DEFAULT_SETTINGS = { remind: true, remindHour: 18, accent: "vert", onboarded: false, allergies: [], diets: [] };
const S = { items: [], history: [], shopping: [], settings: { ...DEFAULT_SETTINGS }, pro: false };
const ui = { tab: "stock", loc: "all", query: "", sheet: null, toast: null };

function persist() {
  saveState({ items: S.items, history: S.history.slice(-1500), shopping: S.shopping, settings: S.settings });
  scheduleReminders(S.items, S.settings);
}
function applyAccent() {
  const a = S.pro ? S.settings.accent : "vert";
  if (a && a !== "vert") document.documentElement.dataset.accent = a;
  else delete document.documentElement.dataset.accent;
}

/* ---------- profil alimentaire ---------- */
const profile = () => ({ allergies: S.settings.allergies || [], diets: S.settings.diets || [] });
// Les produits scannés gardent les faits d'Open Food Facts ; les autres utilisent la base de produits courants.
const factsOf = item => item.facts || presetFacts(item.key);
const checkOf = item => evaluate(factsOf(item), profile());
function alertsBlock(check, compact) {
  if (!hasProfile(profile())) return null;
  const lines = [
    ...check.danger.map(t => h("li", { class: "al danger" }, h("span", { class: "ic", html: I.alert }), t)),
    ...check.warn.map(t => h("li", { class: "al warn" }, h("span", { class: "ic", html: I.info }), t)),
    ...check.good.map(t => h("li", { class: "al good" }, h("span", { class: "ic", html: I.check }), t))
  ];
  if (check.unknown) lines.push(h("li", { class: "al warn" }, h("span", { class: "ic", html: I.info }), "Ingrédients inconnus : vérifiez l'emballage"));
  if (!lines.length) lines.push(h("li", { class: "al ok" }, h("span", { class: "ic", html: I.check }), "Rien de signalé pour votre profil"));
  return h("div", { class: "alerts" + (compact ? " compact" : "") },
    h("ul", {}, lines),
    compact ? null : h("p", { class: "note", style: "padding:0" }, "D'après Open Food Facts ou nos fiches génériques. Vérifiez toujours l'étiquette, surtout en cas d'allergie grave."));
}

/* ---------- actions sur le stock ---------- */
function addItem(p) {
  if (!canAdd(S.items.length, S.pro)) { openPro("limit"); return false; }
  const preset = p.key ? byKey[p.key] : null;
  S.items.push({
    id: newId(), name: p.name.trim(), key: p.key || guessKey(p.name) || null,
    emoji: p.emoji || (preset ? preset.emoji : "🛒"), cat: p.cat || (preset ? preset.cat : "autre"),
    loc: p.loc || "frigo", qty: p.qty || 1, expiry: p.expiry, added: today(),
    price: p.price != null ? p.price : preset ? preset.price : DEFAULT_PRICE, barcode: p.barcode || null,
    facts: p.facts || null,
    state: p.produce && p.loc !== "congel" ? p.state : null, purchased: p.produce ? p.purchased : null
  });
  persist();
  return true;
}
function closeItem(item, outcome, qty) {
  const n = Math.min(qty || item.qty, item.qty);
  const unit = (Number(item.price) || DEFAULT_PRICE) / item.qty;
  if (outcome) S.history.push({ id: newId(), name: item.name, key: item.key, cat: item.cat, outcome, date: today(), price: Math.round(unit * n * 100) / 100 });
  if (n >= item.qty) S.items = S.items.filter(x => x.id !== item.id);
  else { item.price = Math.round(unit * (item.qty - n) * 100) / 100; item.qty -= n; }
  persist();
}
function addToShopping(name) {
  const n = name.trim();
  if (!n) return;
  if (S.shopping.some(s => !s.done && s.name.toLowerCase() === n.toLowerCase())) return;
  S.shopping.push({ id: newId(), name: n, done: false });
  persist();
}

/* ---------- rendu ---------- */
const root = document.getElementById("app");
function render() {
  const page = { stock: renderStock, recettes: renderRecipes, courses: renderShopping, bilan: renderStats }[ui.tab]();
  const frag = document.createDocumentFragment();
  frag.append(page);
  if (ui.tab === "stock") frag.append(h("button", { class: "fab", "aria-label": "Ajouter un produit", html: I.plus, onclick: () => openAdd() }));
  frag.append(renderTabs());
  if (ui.sheet) frag.append(h("div", { class: "scrim", onclick: closeSheet }), ui.sheet());
  if (ui.toast) frag.append(ui.toast.el);
  root.replaceChildren(frag);
}
function go(tab) { ui.tab = tab; ui.sheet = null; render(); window.scrollTo({ top: 0 }); }
function openSheet(fn) { ui.sheet = fn; render(); }
function closeSheet() { ui.sheet = null; render(); }
function toast(text, action) {
  clearTimeout(ui.toast && ui.toast.timer);
  const el = h("div", { class: "toast", role: "status" }, h("span", {}, text),
    action ? h("button", { onclick: () => { action.run(); hideToast(); } }, action.label) : null);
  ui.toast = { el, timer: setTimeout(hideToast, action ? 5000 : 2600) };
  render();
}
function hideToast() { ui.toast = null; render(); }

function renderTabs() {
  const urgentCount = S.items.filter(i => { const n = daysLeft(i.expiry, today()); return n != null && n <= 1; }).length;
  const tab = (id, icon, label, dot) => h("button", { class: "tab", "aria-current": ui.tab === id ? "page" : null, onclick: () => go(id) },
    h("span", { class: "ic", html: icon }, dot ? h("span", { class: "dot" }, dot) : null), label);
  return h("nav", { class: "tabbar", "aria-label": "Sections" }, h("div", { class: "in" },
    tab("stock", I.fridge, "Mon frigo", urgentCount ? String(urgentCount) : null),
    tab("recettes", I.book, "Recettes"),
    tab("courses", I.cart, "Courses"),
    tab("bilan", I.chart, "Bilan")));
}
function head(title, sub, tools) {
  return h("header", { class: "head" }, h("h1", {}, title), sub ? h("p", {}, sub) : null, tools ? h("div", { class: "tools" }, tools) : null);
}

/* ----- Mon frigo ----- */
function renderStock() {
  const t = today();
  const all = S.items.map(i => ({ i, n: daysLeft(i.expiry, t) }));
  const expired = all.filter(x => x.n < 0).length;
  const urgent = all.filter(x => x.n === 0 || x.n === 1).length;
  const week = all.filter(x => x.n >= 2 && x.n <= 7).length;
  const page = h("main", { class: "page" });
  page.append(head("Mon frigo", S.items.length ? plural(S.items.length, "produit") + (S.pro ? "" : " sur " + FREE_LIMIT + " en version gratuite") : "Rien ne se perd, tout se mange.",
    h("button", { class: "iconbtn", "aria-label": "Réglages", html: I.gear, onclick: openSettings })));

  if (!S.items.length) {
    page.append(h("div", { class: "empty" }, h("span", { class: "em" }, "🥕"), h("b", {}, "Votre frigo est vide"),
      h("p", {}, "Ajoutez vos courses : l'appli vous prévient avant qu'elles périment et vous propose quoi cuisiner."),
      h("button", { class: "btn primary", html: I.plus + "<span>Ajouter mes premiers produits</span>", onclick: () => openAdd() })));
    return page;
  }
  page.append(h("div", { class: "summary" },
    h("div", { class: "stat" + (expired ? " bad" : "") }, h("b", {}, expired), h("span", {}, "périmé" + (expired > 1 ? "s" : ""))),
    h("div", { class: "stat" + (urgent ? " hot" : "") }, h("b", {}, urgent), h("span", {}, "aujourd'hui ou demain")),
    h("div", { class: "stat" }, h("b", {}, week), h("span", {}, "cette semaine"))));

  const segBtn = (id, label) => h("button", { "aria-pressed": String(ui.loc === id), onclick: () => { ui.loc = id; render(); } }, label);
  page.append(h("div", { class: "seg", role: "group", "aria-label": "Emplacement" },
    segBtn("all", "Tout"), ...Object.entries(LOCATIONS).map(([k, v]) => segBtn(k, v.label))));

  const search = h("input", { type: "search", placeholder: "Chercher un produit", value: ui.query, "aria-label": "Chercher un produit", enterkeyhint: "search" });
  search.addEventListener("input", () => { ui.query = search.value; renderListOnly(); });
  page.append(h("label", { class: "search", html: I.search }, search));

  const list = h("div", { id: "stock-list", style: "display:flex;flex-direction:column;gap:16px" });
  fillStockList(list);
  page.append(list);
  return page;
}
function renderListOnly() { const el = document.getElementById("stock-list"); if (el) fillStockList(el); }
function fillStockList(list) {
  const t = today();
  const q = ui.query.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const items = sortByExpiry(S.items).filter(i =>
    (ui.loc === "all" || i.loc === ui.loc) &&
    (!q || i.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)));
  list.replaceChildren();
  if (!items.length) { list.append(h("p", { class: "note" }, "Aucun produit ne correspond.")); return; }
  for (const b of BUCKETS) {
    const rows = items.filter(i => bucketOf(daysLeft(i.expiry, t)) === b.id);
    if (!rows.length) continue;
    list.append(h("section", { style: "display:flex;flex-direction:column;gap:8px" },
      h("div", { class: "group-h " + b.id }, h("span", {}, b.label), h("span", { class: "n" }, rows.length)),
      h("div", { class: "group" }, rows.map(itemRow))));
  }
}
function itemRow(i) {
  const n = daysLeft(i.expiry, today());
  const cat = CATEGORIES[i.cat] || CATEGORIES.autre;
  const c = hasProfile(profile()) ? checkOf(i) : null;
  const flag = c && c.danger.length ? "danger" : c && c.warn.length ? "warn" : null;
  return h("button", { class: "row", onclick: () => openItem(i.id), "aria-label": i.name + ", " + leftLabel(n) + (flag === "danger" ? ", incompatible avec votre profil" : flag ? ", à vérifier pour votre profil" : "") },
    h("span", { class: "tile", style: "background:color-mix(in srgb," + cat.color + " 16%, var(--sunk))" }, i.emoji,
      flag ? h("span", { class: "flag " + flag, html: flag === "danger" ? I.alert : I.info }) : null),
    h("span", { class: "meta" }, h("span", { class: "t" }, i.name),
      h("span", { class: "s" }, LOCATIONS[i.loc].label + (i.qty > 1 ? " · ×" + i.qty : "") + " · " + fmtDate(i.expiry))),
    h("span", { class: "pill u-" + urgency(n) }, leftLabel(n)));
}

/* ----- Ajout ----- */
function openAdd(prefill) {
  const st = { q: "", draft: prefill || null, busy: false };
  const sheet = () => {
    const el = h("section", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "Ajouter un produit" }, h("div", { class: "grab" }));
    if (st.draft) { el.append(...draftForm(st).filter(Boolean)); return el; }
    el.append(h("div", { class: "sheet-h" }, h("h2", {}, "Ajouter"),
      h("button", { class: "iconbtn", "aria-label": "Fermer", html: I.x, onclick: closeSheet })));
    el.append(h("button", { class: "btn primary", html: I.scan + "<span>" + (st.busy ? "Recherche du produit…" : "Scanner un code-barres") + "</span>", disabled: st.busy, onclick: () => doScan(st) }));
    const input = h("input", { type: "search", placeholder: "Ou tapez un produit (ex. yaourts)", value: st.q, "aria-label": "Nom du produit", enterkeyhint: "go", autocomplete: "off" });
    input.addEventListener("input", () => { st.q = input.value; renderResults(); });
    input.addEventListener("keydown", e => { if (e.key === "Enter" && st.q.trim()) pickName(st, st.q); });
    el.append(h("label", { class: "search", html: I.search }, input));
    const results = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
    const renderResults = () => {
      const found = searchProducts(st.q).slice(0, st.q ? 12 : PRODUCTS.length);
      results.replaceChildren(
        st.q.trim() ? h("button", { class: "btn", onclick: () => pickName(st, st.q) }, "Ajouter « " + st.q.trim() + " »") : h("p", { class: "note" }, "Produits courants"),
        h("div", { class: "grid-products" }, found.map(p => h("button", { class: "prod", onclick: () => pickPreset(st, p) }, h("span", { class: "em" }, p.emoji), p.name))));
    };
    renderResults();
    el.append(results);
    if (!native) el.append(webBarcodeInput(st));
    return el;
  };
  st.refresh = () => { if (ui.sheet === sheet) render(); };
  openSheet(sheet);
}
// Fruits et légumes : l'état et la date d'achat donnent la date estimée.
function withProduce(d) {
  const p = d.key ? byKey[d.key] : null;
  if (!isProduce(p)) return d;
  d.produce = true;
  d.state = d.state || defaultState(d.key);
  d.purchased = d.purchased || today();
  d.base = p.days;
  d.expiry = produceExpiry({ key: d.key, base: d.base, state: d.state, purchased: d.purchased, today: today() });
  return d;
}
function pickPreset(st, p) {
  st.draft = withProduce({ name: p.name, key: p.key, emoji: p.emoji, cat: p.cat, loc: p.loc, qty: 1, suggested: p.days, expiry: addDays(today(), p.days), price: p.price });
  st.refresh();
}
function pickName(st, name) {
  const key = guessKey(name);
  const p = key ? byKey[key] : null;
  st.draft = withProduce({ name: name.trim(), key, emoji: p ? p.emoji : "🛒", cat: p ? p.cat : "autre", loc: p ? p.loc : "frigo", qty: 1, suggested: p ? p.days : 7, expiry: addDays(today(), p ? p.days : 7), price: p ? p.price : DEFAULT_PRICE });
  st.refresh();
}
function produceSection(d, onChange) {
  const t = today();
  const recompute = () => { d.expiry = produceExpiry({ key: d.key, base: d.base, state: d.state, purchased: d.purchased, today: t }); onChange(); };
  const bought = [["Aujourd'hui", 0], ["Hier", 1], ["Il y a 3 jours", 3], ["Il y a 1 semaine", 7]];
  const boughtInput = h("input", { type: "date", value: d.purchased, max: t, "aria-label": "Date d'achat" });
  boughtInput.addEventListener("change", () => { if (boughtInput.value) { d.purchased = boughtInput.value; recompute(); } });
  const left = produceDaysLeft({ key: d.key, base: d.base, state: d.state, purchased: d.purchased, today: t });
  const tip = stateTip(d.key, d.state);
  return [
    h("div", { class: "field" }, "Acheté",
      h("div", { class: "chips" }, bought.map(([l, n]) => h("button", { class: "chip", "aria-pressed": String(d.purchased === addDays(t, -n)), onclick: () => { d.purchased = addDays(t, -n); recompute(); } }, l))),
      boughtInput),
    h("div", { class: "field" }, "État aujourd'hui",
      h("div", { class: "chips" }, statesFor(d.key).map(s => h("button", { class: "chip", "aria-pressed": String(d.state === s.id), onclick: () => { d.state = s.id; recompute(); } }, s.emoji + " " + s.label)))),
    h("div", { class: "estimate" },
      h("b", {}, left === 0 ? "À manger aujourd'hui" : "Se garde encore environ " + plural(left, "jour")),
      h("span", {}, "jusqu'au " + fmtDate(d.expiry, { weekday: "long", day: "numeric", month: "long" })),
      tip ? h("span", { class: "tip" }, tip) : null)
  ];
}
async function doScan(st) {
  let code;
  try { code = await scanBarcode(); }
  catch (e) {
    if (e && e.code === "installing") toast("Installation du scanner Google… réessayez dans un instant.");
    else if (e && e.code === "unsupported") toast("Le scanner n'est pas disponible sur ce téléphone.");
    else if (e && e.code === "web") toast("Le scanner fonctionne dans l'application Android.");
    return;
  }
  await fromBarcode(st, code);
}
async function fromBarcode(st, code) {
  st.busy = true; st.refresh();
  const found = await lookupBarcode(code);
  st.busy = false;
  if (found) {
    st.draft = { ...found, emoji: found.emoji || "🛒", qty: 1, suggested: found.days, expiry: addDays(today(), found.days), price: found.price != null ? found.price : DEFAULT_PRICE, fromScan: true };
  } else {
    toast("Produit introuvable. Tapez son nom.");
  }
  st.refresh();
}
function webBarcodeInput(st) {
  const inp = h("input", { inputmode: "numeric", placeholder: "Code-barres (test navigateur)", "aria-label": "Code-barres" });
  return h("div", { class: "shop-add" }, inp, h("button", { class: "btn small", onclick: () => inp.value.trim() && fromBarcode(st, inp.value.trim()) }, "Chercher"));
}
function draftForm(st) {
  const d = st.draft;
  const t = today();
  const nameInput = h("input", { value: d.name, "aria-label": "Nom", autocomplete: "off" });
  nameInput.addEventListener("input", () => { d.name = nameInput.value; });
  const choices = [
    ["Aujourd'hui", 0], ["Demain", 1], ["3 jours", 3], ["5 jours", 5], ["1 semaine", 7], ["2 semaines", 14], ["1 mois", 30], ["3 mois", 90]
  ];
  if (d.suggested && !choices.some(c => c[1] === d.suggested)) choices.push(["Conseillé : " + leftLabel(d.suggested).replace("J-", "") + (d.suggested <= 30 ? " j" : ""), d.suggested]);
  choices.sort((a, b) => a[1] - b[1]);
  const dateInput = h("input", { type: "date", value: d.expiry, min: addDays(t, -30), "aria-label": "Date de péremption" });
  dateInput.addEventListener("change", () => { if (dateInput.value) { d.expiry = dateInput.value; st.refresh(); } });
  const locBtn = (k, v) => h("button", { "aria-pressed": String(d.loc === k), onclick: () => {
    if (k === "congel" && d.loc !== "congel") d.expiry = addDays(t, 90);
    if (d.loc === "congel" && k !== "congel") {
      d.expiry = d.produce ? produceExpiry({ key: d.key, base: d.base, state: d.state, purchased: d.purchased, today: t }) : addDays(t, d.suggested || 7);
    }
    d.loc = k; st.refresh();
  } }, v.label);
  const save = again => {
    if (!d.name.trim()) { toast("Donnez un nom au produit."); return; }
    if (!addItem(d)) return;
    toast(d.name.trim() + " ajouté");
    if (again) { st.draft = null; st.q = ""; st.refresh(); } else closeSheet();
  };
  return [
    h("div", { class: "sheet-h" },
      h("button", { class: "iconbtn", "aria-label": "Retour", html: I.back, onclick: () => { st.draft = null; st.refresh(); } }),
      h("h2", {}, d.emoji + " " + (d.fromScan ? "Produit trouvé" : "Nouveau produit"))),
    alertsBlock(evaluate(d.facts || presetFacts(d.key), profile())),
    h("label", { class: "field" }, "Nom", nameInput),
    h("div", { class: "field" }, "Où le rangez-vous ?", h("div", { class: "seg" }, Object.entries(LOCATIONS).map(([k, v]) => locBtn(k, v)))),
    ...(d.produce && d.loc !== "congel"
      ? [...produceSection(d, () => st.refresh()), h("label", { class: "field" }, "Ou choisissez la date vous-même", dateInput)]
      : [h("div", { class: "field" }, "À consommer avant le " + fmtDate(d.expiry, { weekday: "long", day: "numeric", month: "long" }),
          h("div", { class: "chips" }, choices.map(([label, n]) => h("button", {
            class: "chip" + (n === d.suggested ? " suggest" : ""), "aria-pressed": String(d.expiry === addDays(t, n)),
            onclick: () => { d.expiry = addDays(t, n); st.refresh(); } }, label))),
          dateInput),
        h("p", { class: "note" }, "Recopiez la date imprimée sur l'emballage si vous l'avez. Sinon, la durée conseillée est une estimation.")]),
    h("div", { class: "field" }, "Quantité", h("div", { class: "stepper" },
      h("button", { "aria-label": "Moins", onclick: () => { d.qty = Math.max(1, d.qty - 1); st.refresh(); } }, "−"),
      h("b", {}, d.qty),
      h("button", { "aria-label": "Plus", onclick: () => { d.qty = Math.min(99, d.qty + 1); st.refresh(); } }, "+"))),
    h("div", { class: "btns" },
      h("button", { class: "btn", onclick: () => save(true) }, "Ajouter + un autre"),
      h("button", { class: "btn primary", html: I.check + "<span>Ajouter</span>", onclick: () => save(false) }))
  ];
}

/* ----- Fiche produit ----- */
function openItem(id) {
  const st = { editing: false };
  const sheet = () => {
    const i = S.items.find(x => x.id === id);
    if (!i) { setTimeout(closeSheet); return h("div"); }
    const n = daysLeft(i.expiry, today());
    const cat = CATEGORIES[i.cat] || CATEGORIES.autre;
    const el = h("section", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": i.name }, h("div", { class: "grab" }));
    el.append(h("div", { class: "big-item" },
      h("span", { class: "tile", style: "background:color-mix(in srgb," + cat.color + " 18%, var(--surface))" }, i.emoji),
      h("div", { style: "min-width:0;flex:1" }, h("h2", {}, i.name),
        h("p", {}, LOCATIONS[i.loc].label + (i.qty > 1 ? " · ×" + i.qty : "") + " · avant le " + fmtDate(i.expiry, { day: "numeric", month: "long" }))),
      h("span", { class: "pill u-" + urgency(n) }, leftLabel(n))));
    const alerts = alertsBlock(checkOf(i));
    if (alerts) el.append(alerts);
    // Fruits et légumes : mettre à jour l'état recalcule la date.
    const preset = i.key ? byKey[i.key] : null;
    if (isProduce(preset) && i.loc !== "congel") {
      const state = i.state || null;
      const tip = state ? stateTip(i.key, state) : null;
      el.append(h("div", { class: "card" },
        h("b", {}, "État aujourd'hui"),
        i.purchased ? h("p", { class: "note", style: "padding:0" }, "Acheté le " + fmtDate(i.purchased, { day: "numeric", month: "long" })) : null,
        h("div", { class: "chips" }, statesFor(i.key).map(s => h("button", { class: "chip", "aria-pressed": String(state === s.id), onclick: () => {
          i.state = s.id;
          i.expiry = produceExpiry({ key: i.key, base: preset.days, state: s.id, purchased: i.purchased, today: today() });
          persist(); render();
        } }, s.emoji + " " + s.label))),
        tip ? h("p", { class: "note", style: "padding:0" }, tip) : null));
    }
    const done = (outcome, qty) => {
      const name = i.name;
      closeItem(i, outcome, qty);
      const stillHere = S.items.some(x => x.id === i.id);
      if (!stillHere) closeSheet(); else render();
      const msg = outcome === "mange" ? "Bien joué, rien de perdu !" : outcome === "jete" ? "Noté. On fera mieux la prochaine fois." : "Produit retiré";
      if (outcome && S.pro && !stillHere) toast(msg, { label: "À racheter", run: () => { addToShopping(name); toast(name + " ajouté aux courses"); } });
      else toast(msg);
    };
    el.append(h("div", { class: "btns" },
      h("button", { class: "btn primary", html: I.check + "<span>" + (i.qty > 1 ? "Tout mangé" : "Mangé") + "</span>", onclick: () => done("mange") }),
      h("button", { class: "btn danger", html: I.trash + "<span>Jeté</span>", onclick: () => done("jete") })));
    if (i.qty > 1) el.append(h("button", { class: "btn", onclick: () => done("mange", 1) }, "J'en ai mangé un (reste " + (i.qty - 1) + ")"));
    const idea = i.key ? rankRecipes(RECIPES, S.items, today()).find(r => r.have.includes(i.key)) : null;
    if (idea && n != null && n >= 0 && n <= 3) el.append(h("button", { class: "btn ghost", onclick: () => openRecipe(idea.recipe.id) }, "Idée : " + idea.recipe.emoji + " " + idea.recipe.name));
    if (st.editing) {
      const t = today();
      const dateInput = h("input", { type: "date", value: i.expiry, "aria-label": "Nouvelle date" });
      dateInput.addEventListener("change", () => { if (dateInput.value) { i.expiry = dateInput.value; persist(); st.editing = false; render(); } });
      el.append(h("div", { class: "card" }, h("b", {}, "Nouvelle date"),
        h("div", { class: "chips" }, [["Demain", 1], ["3 jours", 3], ["1 semaine", 7], ["1 mois", 30]].map(([l, d]) =>
          h("button", { class: "chip", onclick: () => { i.expiry = addDays(t, d); persist(); st.editing = false; render(); } }, l))),
        h("label", { class: "field" }, "Ou choisissez une date", dateInput)));
    }
    el.append(h("div", { class: "btns" },
      h("button", { class: "btn", html: I.clock + "<span>Changer la date</span>", onclick: () => { st.editing = !st.editing; render(); } }),
      i.loc !== "congel"
        ? h("button", { class: "btn", html: I.snow + "<span>Congeler</span>", onclick: () => { i.loc = "congel"; i.expiry = addDays(today(), 90); persist(); toast("Au congélateur : 3 mois de plus"); render(); } })
        : h("button", { class: "btn", onclick: () => { i.loc = "frigo"; i.expiry = addDays(today(), 2); persist(); toast("Décongelé : à manger sous 2 jours"); render(); } }, "Décongeler")));
    el.append(h("button", { class: "btn ghost", onclick: () => done(null) }, "Supprimer (ajouté par erreur)"));
    return el;
  };
  openSheet(sheet);
}

/* ----- Recettes ----- */
// Recettes compatibles avec le profil : on retire celles dont un ingrédient obligatoire est
// incompatible, et on ignore les ingrédients facultatifs incompatibles.
function recipeFilter() {
  const blocked = blockedKeys(PRODUCTS.map(p => p.key), profile());
  const ok = [], excluded = [];
  for (const r of RECIPES) {
    const bad = r.need.filter(k => blocked.has(k));
    if (bad.length) excluded.push({ recipe: r, bad });
    else ok.push({ ...r, extra: r.extra.filter(k => !blocked.has(k)) });
  }
  return { ok, excluded, blocked };
}
function renderRecipes() {
  const page = h("main", { class: "page" });
  const { ok, excluded } = recipeFilter();
  const usable = S.items.filter(i => !checkOf(i).danger.length);
  const ranked = rankRecipes(ok, usable, today());
  page.append(head("Recettes", ranked.length ? "Avec ce que vous avez, en commençant par ce qui périme bientôt." : "Ajoutez des produits pour des idées sur mesure."));
  if (hasProfile(profile())) page.append(h("p", { class: "note" }, "Adaptées à votre profil alimentaire" + (excluded.length ? " : " + plural(excluded.length, "recette") + " mise" + (excluded.length > 1 ? "s" : "") + " de côté." : ".")));
  if (ranked.length) {
    page.append(h("div", { class: "group-h" }, h("span", {}, "Pour vous"), h("span", { class: "n" }, ranked.length)));
    page.append(h("div", { style: "display:flex;flex-direction:column;gap:10px" }, ranked.slice(0, 12).map(r => recipeCard(r.recipe, r))));
  }
  const others = ok.filter(r => !ranked.some(x => x.recipe.id === r.id));
  page.append(h("div", { class: "group-h" }, h("span", {}, ranked.length ? "Toutes les autres recettes" : "Toutes les recettes"), h("span", { class: "n" }, others.length)));
  page.append(h("div", { style: "display:flex;flex-direction:column;gap:10px" }, others.map(r => recipeCard(r, null))));
  if (excluded.length) {
    page.append(h("details", { class: "excluded" },
      h("summary", {}, "Recettes non compatibles avec votre profil (" + excluded.length + ")"),
      h("div", { style: "display:flex;flex-direction:column;gap:10px;margin-top:10px" }, excluded.map(x => recipeCard(x.recipe, null, x.bad)))));
  }
  return page;
}
function recipeCard(r, match, bad) {
  const uses = match ? match.have.map(k => {
    const it = S.items.find(i => i.key === k);
    const urgentHere = match.urgentUsed.some(u => u.key === k);
    return h("span", { class: "mini" + (urgentHere ? " hot" : "") }, (it ? it.name : byKey[k].name) + (urgentHere ? " · " + leftLabel(daysLeft(it.expiry, today())).toLowerCase() : ""));
  }) : [];
  return h("button", { class: "recipe", onclick: () => openRecipe(r.id) },
    h("span", { class: "tile" }, r.emoji),
    h("span", {}, h("div", { class: "t" }, r.name), h("div", { class: "s" }, r.time + " min · " + plural(r.need.length + r.extra.length, "ingrédient")),
      uses.length ? h("div", { class: "uses" }, uses) : null,
      bad ? h("div", { class: "uses" }, bad.map(k => h("span", { class: "mini bad" }, "Contient : " + byKey[k].name.toLowerCase()))) : null));
}
function openRecipe(id) {
  const r = RECIPES.find(x => x.id === id);
  const st = { cooked: false, pick: {} };
  const sheet = () => {
    const keys = new Set(S.items.filter(i => { const n = daysLeft(i.expiry, today()); return n == null || n >= 0; }).map(i => i.key));
    const el = h("section", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": r.name }, h("div", { class: "grab" }),
      h("div", { class: "sheet-h" }, h("h2", {}, r.emoji + " " + r.name), h("button", { class: "iconbtn", "aria-label": "Fermer", html: I.x, onclick: closeSheet })),
      h("p", { class: "note" }, r.time + " min · sel, poivre, huile et épices supposés dans vos placards"));
    const blocked = blockedKeys(PRODUCTS.map(p => p.key), profile());
    const ing = k => blocked.has(k)
      ? h("li", { class: "bad" }, h("span", { class: "ck", html: I.x }), byKey[k].emoji + " " + byKey[k].name, h("span", { class: "mini bad", style: "margin-left:auto" }, "à éviter pour vous"))
      : h("li", { class: keys.has(k) ? "have" : "miss" }, h("span", { class: "ck", html: keys.has(k) ? I.check : "" }), byKey[k].emoji + " " + byKey[k].name);
    el.append(h("div", { class: "card" }, h("b", {}, "Ingrédients"),
      h("ul", { class: "ingr" }, r.need.map(ing)),
      r.extra.length ? h("p", { class: "note", style: "padding:0" }, "Au choix, selon ce que vous avez :") : null,
      r.extra.length ? h("ul", { class: "ingr" }, r.extra.map(ing)) : null));
    el.append(h("div", { class: "card" }, h("b", {}, "Préparation"), h("ol", { class: "steps" }, r.steps.map(s => h("li", {}, s)))));
    const used = S.items.filter(i => [...r.need, ...r.extra].includes(i.key));
    if (st.cooked && used.length) {
      el.append(h("div", { class: "card" }, h("b", {}, "Qu'avez-vous utilisé ?"),
        h("div", {}, used.map(i => {
          const cb = h("input", { type: "checkbox", checked: st.pick[i.id] !== false });
          cb.addEventListener("change", () => { st.pick[i.id] = cb.checked; });
          return h("label", { class: "check-row" }, cb, h("span", {}, i.emoji + " " + i.name + (i.qty > 1 ? " (×" + i.qty + ")" : "")));
        })),
        h("button", { class: "btn primary", onclick: () => {
          const chosen = used.filter(i => st.pick[i.id] !== false);
          chosen.forEach(i => closeItem(i, "mange"));
          closeSheet();
          toast(chosen.length ? plural(chosen.length, "produit") + " sauvé" + (chosen.length > 1 ? "s" : "") + " du gaspillage !" : "Bon appétit !");
        } }, "Retirer du frigo")));
    } else if (used.length) {
      el.append(h("button", { class: "btn primary", html: I.check + "<span>J'ai cuisiné ça</span>", onclick: () => { st.cooked = true; render(); } }));
    }
    return el;
  };
  openSheet(sheet);
}

/* ----- Courses (Pro) ----- */
function renderShopping() {
  const page = h("main", { class: "page" });
  page.append(head("Courses", S.pro ? "Ce qu'il faut racheter." : null));
  if (!S.pro) { page.append(proCard("courses")); return page; }
  const inp = h("input", { placeholder: "Ajouter un article", "aria-label": "Article", enterkeyhint: "done", autocomplete: "off" });
  const add = () => { addToShopping(inp.value); inp.value = ""; render(); setTimeout(() => { const n = document.querySelector(".shop-add input"); if (n) n.focus(); }); };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") add(); });
  page.append(h("div", { class: "shop-add" }, inp, h("button", { class: "btn primary small", "aria-label": "Ajouter", html: I.plus, onclick: add })));
  const todo = S.shopping.filter(s => !s.done), done = S.shopping.filter(s => s.done);
  if (!S.shopping.length) {
    page.append(h("div", { class: "empty" }, h("span", { class: "em" }, "🧺"), h("b", {}, "Liste vide"), h("p", {}, "Quand vous finissez un produit, touchez « À racheter » pour l'ajouter ici.")));
  }
  const row = s => {
    const cb = h("input", { type: "checkbox", checked: s.done, "aria-label": s.name });
    cb.addEventListener("change", () => { s.done = cb.checked; persist(); render(); });
    return h("label", { class: "shop-row" + (s.done ? " done" : "") }, cb, h("span", {}, s.name),
      h("button", { class: "x", "aria-label": "Supprimer " + s.name, html: I.x, onclick: e => { e.preventDefault(); S.shopping = S.shopping.filter(x => x.id !== s.id); persist(); render(); } }));
  };
  if (todo.length) page.append(h("div", { class: "group" }, todo.map(row)));
  if (done.length) {
    page.append(h("div", { class: "group-h" }, h("span", {}, "Dans le panier"), h("span", { class: "n" }, done.length)));
    page.append(h("div", { class: "group" }, done.map(row)));
    page.append(h("button", { class: "btn", onclick: () => { S.shopping = S.shopping.filter(s => !s.done); persist(); render(); } }, "Retirer les articles cochés"));
  }
  // Suggestions : produits finis récemment et pas encore dans la liste.
  const recent = [...new Set(S.history.slice(-30).reverse().map(x => x.name))]
    .filter(n => !S.shopping.some(s => s.name.toLowerCase() === n.toLowerCase()) && !S.items.some(i => i.name.toLowerCase() === n.toLowerCase()))
    .slice(0, 8);
  if (recent.length) {
    page.append(h("div", { class: "group-h" }, h("span", {}, "Finis récemment")));
    page.append(h("div", { class: "chips" }, recent.map(n => h("button", { class: "chip", onclick: () => { addToShopping(n); render(); } }, "+ " + n))));
  }
  return page;
}

/* ----- Bilan ----- */
function renderStats() {
  const now = new Date();
  const from = isoOf(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = isoOf(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const m = stats(S.history, from, to);
  const all = stats(S.history, "0000-01-01", "9999-12-31");
  const month = now.toLocaleDateString("fr-FR", { month: "long" });
  const page = h("main", { class: "page" });
  page.append(head("Bilan", "Ce que vous avez sauvé du gaspillage."));
  if (!S.history.length) {
    page.append(h("div", { class: "empty" }, h("span", { class: "em" }, "📊"), h("b", {}, "Pas encore de bilan"),
      h("p", {}, "Quand vous marquez un produit « Mangé » ou « Jeté », votre bilan apparaît ici.")));
    return page;
  }
  const total = m.eaten + m.thrown;
  page.append(h("section", { class: "card" },
    h("span", { class: "note", style: "padding:0;font-weight:700" }, "Économisé en " + month),
    h("div", { class: "hero-stat" }, euro(m.saved)),
    h("p", { class: "note", style: "padding:0" }, "Valeur estimée des produits consommés à temps, d'après des prix moyens."),
    total ? h("div", { class: "ratio", role: "img", "aria-label": m.eaten + " consommés, " + m.thrown + " jetés" },
      m.eaten ? h("i", { class: "a", style: "width:" + (100 * m.eaten / total) + "%" }) : null,
      m.thrown ? h("i", { class: "b", style: "width:" + (100 * m.thrown / total) + "%" }) : null) : null,
    h("div", { class: "legend" },
      h("span", {}, h("i", { style: "background:var(--ok)" }), plural(m.eaten, "consommé")),
      h("span", {}, h("i", { style: "background:var(--expired)" }), plural(m.thrown, "jeté") + (m.lost ? " (" + euro(m.lost) + ")" : "")))));
  page.append(h("div", { class: "summary" },
    h("div", { class: "stat good" }, h("b", {}, m.rate == null ? "—" : m.rate + " %"), h("span", {}, "sauvés ce mois")),
    h("div", { class: "stat" }, h("b", {}, all.eaten), h("span", {}, "consommés depuis le début")),
    h("div", { class: "stat good" }, h("b", {}, euro(all.saved).replace(/,00/, "")), h("span", {}, "économisés au total"))));
  page.append(h("div", { class: "group-h" }, h("span", {}, "Derniers produits")));
  page.append(h("div", { class: "group" }, S.history.slice(-12).reverse().map(x => {
    const p = x.key ? byKey[x.key] : null;
    return h("div", { class: "row", style: "cursor:default" },
      h("span", { class: "tile" }, p ? p.emoji : "🛒"),
      h("span", { class: "meta" }, h("span", { class: "t" }, x.name), h("span", { class: "s" }, fmtDate(x.date))),
      h("span", { class: "pill " + (x.outcome === "mange" ? "u-ok" : "u-expired") }, x.outcome === "mange" ? "Mangé" : "Jeté"));
  })));
  return page;
}

/* ----- Pro ----- */
const PRO_FEATURES = [
  ["Produits illimités", "La version gratuite suit jusqu'à " + FREE_LIMIT + " produits à la fois."],
  ["Liste de courses", "Ajoutez en un geste ce que vous venez de finir."],
  ["Couleurs de l'appli", "Choisissez la couleur qui vous plaît."],
  ["Soutenir l'appli", "Sans publicité, sans compte, vos données restent sur votre téléphone."]
];
function proCard(reason) {
  const card = h("section", { class: "card pro-card" },
    h("h2", {}, "Passez à Pro ", h("span", { class: "badge-pro" }, "PRO")),
    reason === "limit" ? h("p", {}, "Vous avez atteint " + FREE_LIMIT + " produits, la limite de la version gratuite.") : null,
    h("ul", { class: "pro-list" }, PRO_FEATURES.map(([t, s]) => h("li", {}, h("span", { class: "ck", html: I.check }), h("div", {}, h("b", {}, t), h("p", { class: "note", style: "padding:0" }, s))))),
    h("button", { class: "btn primary", onclick: async () => {
      try { await buyPro(); S.pro = true; applyAccent(); closeSheet(); toast("Merci ! Pro est activé."); }
      catch (e) { toast(e && e.message ? e.message : "L'achat n'a pas abouti."); }
    } }, "Débloquer Pro — achat unique"),
    h("button", { class: "btn ghost small", onclick: async () => {
      const ok = await restorePro(); S.pro = ok; applyAccent(); render(); toast(ok ? "Achat restauré." : "Aucun achat trouvé sur ce compte Google.");
    } }, "Restaurer un achat"));
  return card;
}
function openPro(reason) {
  openSheet(() => h("section", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "Pro" }, h("div", { class: "grab" }), proCard(reason)));
}

/* ----- Réglages ----- */
function openSettings() {
  const st = { confirmWipe: false, taps: 0 };
  const sheet = () => {
    const el = h("section", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "Réglages" }, h("div", { class: "grab" }),
      h("div", { class: "sheet-h" }, h("h2", {}, "Réglages"), h("button", { class: "iconbtn", "aria-label": "Fermer", html: I.x, onclick: closeSheet })));
    const sw = h("input", { type: "checkbox", class: "switch", checked: S.settings.remind, "aria-label": "Rappel quotidien" });
    sw.addEventListener("change", async () => {
      S.settings.remind = sw.checked;
      if (sw.checked && native && !(await notificationsAllowed()) && !(await askNotifications())) {
        toast("Autorisez les notifications dans les réglages du téléphone.");
      }
      persist(); render();
    });
    const hour = h("select", { "aria-label": "Heure du rappel", disabled: !S.settings.remind },
      Array.from({ length: 15 }, (_, k) => k + 7).map(hh => h("option", { value: hh, selected: S.settings.remindHour === hh }, hh + " h")));
    hour.addEventListener("change", () => { S.settings.remindHour = Number(hour.value); persist(); });
    el.append(h("div", { class: "group" },
      h("label", { class: "setting" }, h("div", {}, h("div", { class: "t" }, "Rappel quotidien"), h("div", { class: "s" }, "Quand des produits sont à manger aujourd'hui ou demain")), sw),
      h("div", { class: "setting" }, h("div", {}, h("div", { class: "t" }, "Heure du rappel")), hour)));

    /* profil alimentaire (gratuit : c'est une question de santé et de convictions) */
    const toggle = (field, id) => {
      const list = new Set(S.settings[field] || []);
      list.has(id) ? list.delete(id) : list.add(id);
      S.settings[field] = [...list]; persist(); render();
    };
    el.append(h("div", { class: "card" },
      h("b", {}, "Mon profil alimentaire"),
      h("p", { class: "note", style: "padding:0" }, "Les produits et recettes incompatibles seront signalés."),
      h("div", { class: "field" }, "Allergies et intolérances",
        h("div", { class: "chips" }, ALLERGENS.map(a => h("button", { class: "chip", "aria-pressed": String((S.settings.allergies || []).includes(a.id)), onclick: () => toggle("allergies", a.id) }, a.label)))),
      h("div", { class: "field" }, "Régime ou religion",
        h("div", { class: "chips" }, DIETS.map(d => h("button", { class: "chip", title: d.hint, "aria-pressed": String((S.settings.diets || []).includes(d.id)), onclick: () => toggle("diets", d.id) }, d.label)))),
      h("p", { class: "note", style: "padding:0" }, "Les alertes viennent d'Open Food Facts (produits scannés) ou de fiches génériques (produits courants). Une absence d'alerte ne garantit pas l'absence d'un ingrédient : lisez toujours l'étiquette. Pour le halal et le casher, seule la mention de certification sur l'emballage fait foi.")));

    if (S.pro) {
      const sw2 = (k, c) => h("button", { class: "swatch", style: "background:" + c, "aria-label": "Couleur " + k, "aria-pressed": String((S.settings.accent || "vert") === k),
        onclick: () => { S.settings.accent = k; applyAccent(); persist(); render(); } });
      el.append(h("div", { class: "card" }, h("b", {}, "Couleur de l'appli ", h("span", { class: "badge-pro" }, "PRO")),
        h("div", { class: "swatches" }, sw2("vert", "#14945A"), sw2("bleu", "#1A73E8"), sw2("violet", "#6D4AE0"), sw2("corail", "#E0563C"))));
    } else {
      el.append(h("button", { class: "btn", onclick: () => openPro() }, "Découvrir Pro"));
    }

    el.append(h("div", { class: "card" }, h("b", {}, "Vos données"),
      h("p", { class: "note", style: "padding:0" }, "Tout est enregistré uniquement sur ce téléphone. Aucun compte, aucune publicité. Quand vous scannez un code-barres, seul ce code est envoyé à Open Food Facts pour trouver le nom du produit."),
      st.confirmWipe
        ? h("div", { class: "btns" },
            h("button", { class: "btn danger", onclick: () => { S.items = []; S.history = []; S.shopping = []; persist(); closeSheet(); toast("Toutes les données ont été effacées."); } }, "Oui, tout effacer"),
            h("button", { class: "btn", onclick: () => { st.confirmWipe = false; render(); } }, "Annuler"))
        : h("button", { class: "btn danger", onclick: () => { st.confirmWipe = true; render(); } }, "Effacer toutes mes données")));

    el.append(h("p", { class: "note", onclick: () => {
      if (!import.meta.env.DEV) return;
      st.taps += 1;
      if (st.taps >= 7) { S.pro = !S.pro; setDevPro(S.pro); applyAccent(); toast("Mode test : Pro " + (S.pro ? "activé" : "désactivé")); st.taps = 0; render(); }
    } }, "Version " + __APP_VERSION__ + " · Noms de produits : Open Food Facts (licence ODbL) · Recettes originales"));
    return el;
  };
  openSheet(sheet);
}

/* ---------- démarrage ---------- */
async function start() {
  const saved = await loadState();
  if (saved) {
    S.items = saved.items || [];
    S.history = saved.history || [];
    S.shopping = saved.shopping || [];
    S.settings = { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };
  }
  S.pro = await isPro();
  applyAccent();
  render();
  scheduleReminders(S.items, S.settings);
  onReminderTap(extra => go(extra && extra.tab ? extra.tab : "stock"));
  if (native) {
    App.addListener("backButton", () => {
      if (ui.sheet) closeSheet();
      else if (ui.tab !== "stock") go("stock");
      else App.exitApp();
    });
    App.addListener("resume", () => { render(); scheduleReminders(S.items, S.settings); });
    if (S.settings.remind && !S.settings.onboarded) {
      S.settings.onboarded = true;
      await askNotifications();
      persist();
    }
  }
}
start();
