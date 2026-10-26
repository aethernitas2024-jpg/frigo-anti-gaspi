# Publier Frigo anti-gaspi sur Google Play

Ce guide part du projet tel qu'il est dans ce dossier. Les étapes 1 à 3 se font sur ton PC ; les suivantes dans la Play Console.

## 0. Ce qu'il faut avoir
- Un compte développeur Google Play : https://play.google.com/console (inscription unique d'environ 25 $, vérification d'identité demandée par Google).
- Android Studio (déjà installé sur ce PC).
- Une page web publique pour la politique de confidentialité : le fichier `docs/confidentialite.html` est prêt, il suffit de l'héberger (GitHub Pages, Netlify ou ton site).

## 1. Choisir le nom et l'identifiant définitifs
- Nom affiché : `appName` dans `capacitor.config.json` et `app_name` / `title_activity_main` dans `android/app/src/main/res/values/strings.xml`.
- Identifiant : `appId` dans `capacitor.config.json` (actuellement `fr.antigaspi.frigo`). **Il ne peut plus jamais changer une fois l'appli envoyée sur Google Play.** Choisis-le avant le premier envoi (par exemple `fr.tonnom.frigo`) et remplace-le aussi dans `android/app/build.gradle` (`namespace` et `applicationId`) ainsi que dans le dossier Java `android/app/src/main/java/...`.

## 2. Tester sur ton téléphone
1. Sur le téléphone : Paramètres → À propos → Informations sur le logiciel → touche 7 fois « Numéro de version » pour activer le mode développeur, puis active « Débogage USB ».
2. Le plus simple : copie `FrigoAntiGaspi-debug.apk` (à la racine du projet) sur le téléphone et ouvre-le (autorise l'installation depuis cette source).
3. Ou, téléphone branché en USB : `npm run android:sync` puis, dans Android Studio (`npm run android:open`), bouton ▶.

Après chaque modification du code : `npm run android:sync`, puis reconstruire.

## 3. Créer le fichier à envoyer (AAB signé)
1. `npm run android:sync`
2. `npm run android:open` pour ouvrir le projet dans Android Studio.
3. Menu **Build → Generate Signed App Bundle or APK → Android App Bundle**.
4. **Create new…** pour créer ta clé de signature (keystore). Choisis toi-même le mot de passe.
   - **Garde ce fichier `.jks` et ses mots de passe en lieu sûr (et en double).** Sans eux, tu ne pourras plus publier de mise à jour. Ne les mets jamais dans un dépôt Git.
5. Variante **release** → le fichier `app-release.aab` est créé dans `android/app/release/`.
6. À chaque mise à jour, augmente `versionCode` (et `versionName`) dans `android/app/build.gradle`.

## 4. Créer l'appli dans la Play Console
- **Créer une application** → nom, langue par défaut Français, Application, Gratuite.
- **Fiche Play Store** : textes prêts dans `docs/fiche-play-store.md`. Il faut aussi :
  - une icône 512 × 512 px (PNG) ;
  - une image de présentation 1024 × 500 px ;
  - au moins 2 captures d'écran du téléphone (fais-les sur ton téléphone avec l'appli remplie).
- **Contenu de l'application** :
  - Politique de confidentialité : l'adresse de la page hébergée.
  - Sécurité des données : l'appli ne collecte aucune donnée personnelle et n'en partage aucune. Seul le code-barres scanné est envoyé à Open Food Facts pour trouver le nom du produit (pas de donnée personnelle). Pas de compte, pas de publicité.
  - Publicités : non. Public cible : 18 ans et plus (ou tout public hors enfants). Classification du contenu : questionnaire, catégorie « Utilitaire / Productivité ».
  - Catégorie de la fiche : Alimentation et boissons (ou Style de vie).

## 5. Test fermé obligatoire (comptes personnels récents)
Pour un compte développeur **personnel** créé récemment, Google impose un **test fermé avec au moins 12 testeurs pendant 14 jours d'affilée** avant de pouvoir publier en production. Vérifie la règle en vigueur dans la Play Console, elle évolue.
- Test → Tests fermés → crée un canal, ajoute les adresses Gmail de tes testeurs (famille, amis), envoie-leur le lien d'inscription.
- Envoie l'AAB, attends 14 jours avec au moins 12 testeurs inscrits, puis demande l'accès à la production.

## 6. Brancher l'achat Pro (achat unique)
1. Play Console → Monétiser → Produits → **Produits intégrés** → créer un produit avec l'identifiant `pro` (prix au choix, par exemple 2,99 €). Cela demande d'avoir déjà envoyé un AAB et configuré un profil de paiement.
2. Côté code, tout passe par `src/pro.js` (`isPro`, `buyPro`, `restorePro`) : c'est le seul fichier à compléter avec un plugin d'achat Google Play pour Capacitor (par exemple RevenueCat, gratuit en dessous d'un certain chiffre d'affaires, ou `cordova-plugin-purchase`).
3. Tester l'achat avec un compte testeur de licence (Play Console → Paramètres → Test de licence) : les achats de test ne sont pas facturés.

## 7. Mises à jour
Modifier le code → `npm test` → `npm run android:sync` → augmenter `versionCode` → générer l'AAB signé avec la même clé → l'envoyer dans la Play Console.
