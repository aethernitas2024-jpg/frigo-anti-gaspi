// Version Pro (achat unique). L'achat in-app Google Play se branche ici une fois
// le produit « pro » créé dans la Play Console (voir docs/PUBLIER.md, étape 6).
// En attendant, buyPro() explique que l'achat n'est pas encore disponible.
import { Preferences } from "@capacitor/preferences";

const KEY = "frigo.pro";

export async function isPro() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value === "1";
  } catch {
    return false;
  }
}

export async function buyPro() {
  throw new Error("L'achat Pro sera disponible dès la sortie sur Google Play.");
}

export async function restorePro() {
  return isPro();
}

// Mode test, uniquement en développement (7 appuis sur le numéro de version).
export function setDevPro(on) {
  Preferences.set({ key: KEY, value: on ? "1" : "0" }).catch(() => {});
}
