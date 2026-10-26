// Accès au téléphone : sauvegarde, rappels, scanner, recherche Open Food Facts.
// Dans un navigateur (développement), chaque service se replie sur un équivalent simple.
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { LocalNotifications } from "@capacitor/local-notifications";
import { BarcodeScanner, BarcodeFormat } from "@capacitor-mlkit/barcode-scanning";
import { addDays, isoOf, reminderFor } from "./logic.js";
import { guessKey, byKey } from "./data/products.js";
import { factsFromOff } from "./diet.js";

export const native = Capacitor.isNativePlatform();

/* ---------- sauvegarde ---------- */
const KEY = "frigo.state.v1";
export async function loadState() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
// Écriture immédiate : l'appli peut être fermée juste après une modification.
// Les écritures s'enchaînent dans l'ordre pour qu'une ancienne ne remplace jamais une plus récente.
let saving = Promise.resolve();
export function saveState(state) {
  const value = JSON.stringify(state);
  saving = saving.then(() => Preferences.set({ key: KEY, value })).catch(() => {});
  return saving;
}

/* ---------- rappels quotidiens ---------- */
const REMINDER_IDS = Array.from({ length: 14 }, (_, i) => 100 + i);

export async function notificationsAllowed() {
  if (!native) return false;
  try {
    const p = await LocalNotifications.checkPermissions();
    return p.display === "granted";
  } catch {
    return false;
  }
}
export async function askNotifications() {
  if (!native) return false;
  try {
    const p = await LocalNotifications.requestPermissions();
    return p.display === "granted";
  } catch {
    return false;
  }
}
// Reprogramme les 14 prochains rappels d'après le stock actuel.
// Appelé à chaque modification du stock et à chaque ouverture de l'appli.
export async function scheduleReminders(items, settings) {
  if (!native) return;
  try {
    await LocalNotifications.cancel({ notifications: REMINDER_IDS.map(id => ({ id })) });
    if (!settings.remind || !(await notificationsAllowed())) return;
    const now = new Date();
    const today = isoOf(now);
    const list = [];
    REMINDER_IDS.forEach((id, d) => {
      const day = addDays(today, d);
      const at = new Date(day + "T00:00:00");
      at.setHours(settings.remindHour, 0, 0, 0);
      if (at <= now) return;
      const r = reminderFor(items, day);
      // isExactNotification: false → alarme non exacte : pas d'écran « Alarmes et rappels »
      // ni de permission réservée aux applis d'alarme. Quelques minutes d'écart suffisent ici.
      if (r) list.push({ id, title: r.title, body: r.body, schedule: { at, allowWhileIdle: true }, isExactNotification: false, extra: { tab: "recettes" } });
    });
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch {
    /* un rappel manqué ne doit jamais bloquer l'appli */
  }
}
export function onReminderTap(fn) {
  if (!native) return;
  LocalNotifications.addListener("localNotificationActionPerformed", e => fn(e.notification && e.notification.extra));
}

/* ---------- scanner de code-barres ---------- */
// Utilise le scanner Google intégré au téléphone : aucune permission caméra à demander.
export async function scanBarcode() {
  if (!native) throw { code: "web" };
  const { supported } = await BarcodeScanner.isSupported();
  if (!supported) throw { code: "unsupported" };
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    throw { code: "installing" };
  }
  const { barcodes } = await BarcodeScanner.scan({
    formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE]
  });
  const code = barcodes && barcodes[0] && barcodes[0].rawValue;
  if (!code) throw { code: "cancelled" };
  return code;
}

/* ---------- Open Food Facts (base libre, gratuite) ---------- */
const CAT_RULES = [
  ["en:frozen-foods", { cat: "surgele", loc: "congel", days: 180 }],
  ["en:dairies", { cat: "laitier", loc: "frigo", days: 10 }],
  ["en:cheeses", { cat: "laitier", loc: "frigo", days: 14 }],
  ["en:meats", { cat: "viande", loc: "frigo", days: 3 }],
  ["en:fishes", { cat: "viande", loc: "frigo", days: 2 }],
  ["en:seafood", { cat: "viande", loc: "frigo", days: 2 }],
  ["en:fresh-vegetables", { cat: "legume", loc: "frigo", days: 7 }],
  ["en:fresh-fruits", { cat: "legume", loc: "frigo", days: 7 }],
  ["en:beverages", { cat: "boisson", loc: "placard", days: 90 }],
  ["en:prepared-meals", { cat: "traiteur", loc: "frigo", days: 5 }],
  ["en:breads", { cat: "epicerie", loc: "placard", days: 4 }]
];
export async function lookupBarcode(code) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const url = "https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) +
      ".json?fields=product_name,product_name_fr,generic_name_fr,brands,categories_tags,quantity," +
      "allergens_tags,traces_tags,ingredients_tags,ingredients_analysis_tags,labels_tags,ingredients_text_fr,ingredients_text";
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data && data.product;
    if (!p || data.status === 0) return null;
    const name = (p.product_name_fr || p.product_name || p.generic_name_fr || "").trim();
    if (!name) return null;
    const key = guessKey(name);
    const preset = key ? byKey[key] : null;
    const tags = p.categories_tags || [];
    const rule = (CAT_RULES.find(([t]) => tags.includes(t)) || [null, null])[1];
    const brand = (p.brands || "").split(",")[0].trim();
    return {
      name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? name + " " + brand : name,
      key,
      emoji: preset ? preset.emoji : null,
      cat: preset ? preset.cat : rule ? rule.cat : "epicerie",
      loc: preset ? preset.loc : rule ? rule.loc : "placard",
      days: preset ? preset.days : rule ? rule.days : 30,
      price: preset ? preset.price : null,
      barcode: code,
      facts: factsFromOff(p)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
