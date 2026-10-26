// Fruits et légumes : conservation estimée d'après l'état observé et la date d'achat.
// Logique pure, testée dans tests/produce.test.js.
import { addDays, daysLeft } from "./logic.js";

// Fruits qui continuent de mûrir après l'achat, et jours gagnés quand ils ne sont pas encore mûrs.
const RIPENING = { banane: 4, avocat: 4, tomate: 3, kiwi: 5, poire: 4, peche: 3, mangue: 4, melon: 3 };
export const isRipening = key => key in RIPENING;
export const isProduce = p => !!p && p.cat === "legume";

export const STATES_RIPENING = [
  { id: "pas_mur", label: "Pas mûr", emoji: "🟢" },
  { id: "mur", label: "Mûr", emoji: "🟡" },
  { id: "tres_mur", label: "Très mûr", emoji: "🟠" },
  { id: "abime", label: "Abîmé", emoji: "🟤" }
];
export const STATES_FRESH = [
  { id: "frais", label: "Bien frais", emoji: "🟢" },
  { id: "fatigue", label: "Commence à flétrir", emoji: "🟠" },
  { id: "abime", label: "Abîmé", emoji: "🟤" }
];
export const statesFor = key => (isRipening(key) ? STATES_RIPENING : STATES_FRESH);
export const defaultState = key => (isRipening(key) ? "mur" : "frais");

// Jours restants à partir d'aujourd'hui.
// `base` = durée habituelle d'un produit frais ou mûr ; `purchased` = date d'achat (AAAA-MM-JJ).
export function produceDaysLeft({ key, base, state, purchased, today }) {
  const elapsed = purchased ? Math.max(0, -daysLeft(purchased, today)) : 0;
  switch (state) {
    case "pas_mur": return base + (RIPENING[key] || 3);
    case "mur": return base;
    case "tres_mur": return Math.max(1, Math.round(base * 0.3));
    case "fatigue": return Math.max(1, Math.round(base * 0.3));
    case "abime": return 0;
    case "frais":
    default: return Math.max(1, base - elapsed);
  }
}
export function produceExpiry(opts) {
  return addDays(opts.today, produceDaysLeft(opts));
}

// Conseil affiché selon l'état.
export function stateTip(key, state) {
  if (state === "abime") return "Retirez la partie abîmée et consommez le reste aujourd'hui (compote, soupe, smoothie).";
  if (state === "tres_mur") return key === "banane" ? "Parfaite pour un gâteau à la banane ou un smoothie." : "À manger vite, ou à cuire (compote, sauce, soupe).";
  if (state === "fatigue") return "Encore bon cuit : soupe, poêlée, gratin.";
  if (state === "pas_mur") return "Laissez mûrir à température ambiante, puis passez l'état sur « Mûr ».";
  return null;
}
