# Le Bon Angle — site Internet

**Une méthode de clarification et de repositionnement professionnel, augmentée par l'IA et prolongée par un accompagnement humain.** Une offre de BUILD RH.

Site statique (HTML, CSS, JavaScript vanilla) : pas de build, pas de base de données, pas de cookie, pas de traceur. Hébergé sur GitHub Pages.

En ligne : <https://almosnishirley.github.io/le-bon-angle/>

---

## 1. Structure

```
le-bon-angle/
├── index.html              Accueil
├── methode.html            La méthode
├── offres.html             Les 4 offres + comparatif + guide de choix
├── atelier.html            Analyse Le Bon Angle : vente, formulaire, résultat
├── accompagnement.html     Les 3 accompagnements humains (#debrief #refonte #acceleration)
├── a-propos.html           Shirley et BUILD RH
├── faq.html                Questions fréquentes
├── cgv.html                Conditions générales de vente (analyse)
├── confidentialite.html    Politique de confidentialité
├── mentions-legales.html   Mentions légales
├── 404.html                Page introuvable
├── sitemap.xml · robots.txt · favicon.svg
├── assets/
│   ├── css/style.css       Toute la mise en forme (palette en haut du fichier)
│   ├── js/config.js        ← PRIX, LIENS, PARAMÈTRES : le fichier à modifier
│   ├── js/main.js          Applique config.js, menu mobile
│   ├── js/atelier.js       Lecture du CV, envoi au relais, affichage du résultat
│   ├── fonts/              Fraunces (titres) + Atkinson Hyperlegible (texte), auto-hébergées
│   ├── images/og-image.png Image de partage 1200 × 630
│   └── vendor/             pdf.js, mammoth, marked, DOMPurify (sans CDN)
└── worker/                 Relais Cloudflare (garde la clé Dust secrète) — inchangé
```

L'adresse `atelier.html` est conservée pour ne casser aucun lien existant (Payhip, e-mails, partages).

---

## 2. Modifier les prix

Tout est dans **`assets/js/config.js`**, bloc `OFFRES` :

```js
analyse:      { prix: 12,  prixCible: 19,  mention: "Tarif de lancement", lienPaiement: "https://payhip.com/b/k5c6D" },
debrief:      { prix: 149, lien: "", deductionAnalyse: true, deductionJours: 7 },
refonte:      { prix: 450, lien: "" },
acceleration: { prix: 690, prixCible: 790, mention: "Tarif de lancement", paiement: "…", lien: "" }
```

- **Passer l'analyse à 19 €** : `prix: 19, prixCible: null, mention: ""`. Pensez à modifier aussi le prix **dans Payhip**.
- Tous les prix du site (boutons, cartes, tableau comparatif, FAQ, données structurées) se mettent à jour seuls.
- Les pages contiennent aussi le prix en dur, affiché si JavaScript est désactivé et lu par certains moteurs. Pour les aligner, faites un rechercher-remplacer (ex. `12 €`) dans les fichiers `.html`.
- Déduction de l'analyse sur le débrief : `deductionAnalyse: false` masque toutes les mentions.

## 3. Liens de rendez-vous et de paiement

| Besoin | Champ dans `config.js` |
|---|---|
| Agenda utilisé par tous les boutons « Prendre rendez-vous » | `LIEN_RDV` (Calendly) |
| Lien propre au Débrief (ex. un type d'événement Calendly payant) | `OFFRES.debrief.lien` |
| Lien propre à la Refonte | `OFFRES.refonte.lien` |
| Lien propre à l'Accélération | `OFFRES.acceleration.lien` |
| Paiement de l'analyse (Payhip) | `OFFRES.analyse.lienPaiement` |
| E-mail public, LinkedIn, photo | `EMAIL`, `LIEN_LINKEDIN`, `PHOTO` |

Un lien d'offre vide renvoie vers `LIEN_RDV`. Si `LIEN_RDV` est vide aussi, les boutons ouvrent un e-mail vers `EMAIL`.

**Si vous changez le lien Calendly** : il apparaît aussi en dur dans les pages (lien de secours sans JavaScript). Rechercher-remplacer `calendly.com/shirley-chiche-buildrh/call-decouverte` dans les `.html`.

## 4. Modifier les textes

Les textes sont dans les fichiers `.html`, découpés en blocs commentés (`<!-- ===== HERO ===== -->`…). Rechercher la phrase (Cmd + F), la remplacer.

⚠️ L'en-tête (menu) et le pied de page sont **recopiés dans chaque page**. Pour ajouter un lien au menu, modifiez les 11 fichiers (rechercher `<nav id="main-nav"`).

**Emplacements à compléter** (masqués par défaut) : `[PHOTO DE SHIRLEY À AJOUTER]`, `[PARCOURS DÉTAILLÉ À AJOUTER…]`, `[RÉFÉRENCES OU INTERVENTIONS À AJOUTER…]` (à propos). Remplacez la balise `<div class="placeholder">…</div>` par le vrai contenu. Pour les masquer tous d'un coup en attendant : `AFFICHER_EMPLACEMENTS: false`.

**Photo** : portrait 4:5 (≈ 800 × 1000 px, < 200 Ko) dans `assets/images/`, puis `PHOTO: "assets/images/shirley.jpg"`.

## 5. Paramètres de l'agent (Analyse)

Bloc `ATELIER` de `config.js` :

| Champ | Rôle |
|---|---|
| `API_URL` | Adresse du relais Cloudflare Worker. Vide = page « pas encore ouverte » |
| `CODE_REQUIS` | Code d'analyse obligatoire (clé Payhip ou code personnel) |
| `MAX_CARACTERES` | 40 000, identique au relais |
| `ATTENTE_MAX_MINUTES` | Délai avant message « plus long que prévu » |

Fonctionnement (inchangé) :

```
Navigateur ──► Relais Cloudflare Worker ──► API Dust ──► agent Le Bon Angle
(atelier.js)    (worker/src/index.js : clé Dust, Payhip, consignes)
```

- `POST /analyze` `{ message, accessCode }` puis `GET /result?c=…` : contrat identique à l'ancienne version, **le relais n'a pas besoin d'être redéployé**.
- Le message envoyé contient désormais en plus : situation actuelle, rôles envisagés, autres supports, priorité attendue. Il demande à l'agent de commencer par une section `## Synthèse`. Le résultat est découpé en blocs, un par titre, avec un sommaire.
- Secrets (`DUST_API_KEY`, `ACCESS_CODE`, `PAYHIP_SECRET`) : **uniquement dans Cloudflare**, jamais dans `config.js`.
- Mise en service du relais : voir les commentaires en tête de `worker/src/index.js` et `worker/wrangler.toml`.

## 6. Pages légales

`mentions-legales.html`, `cgv.html`, `confidentialite.html`. Les informations société (SIRET, adresse, médiateur…) viennent de `config.js` (section 4). Le reste du texte se modifie directement dans les pages. Toute modification juridique doit être relue par un·e professionnel·le du droit.

## 7. Couleurs et typographie

Charte Build RH, définie en haut de `assets/css/style.css` (`:root`).

| Rôle | Couleur | Remarque |
|---|---|---|
| Rose poudré (boutons, blocs) | `#E7C2C0` | texte toujours noir dessus |
| Rose très clair (sections alternées) | `#F8EFEE` | |
| Noir | `#171717` | |
| Blanc (fond) | `#FFFFFF` | |
| Rose foncé (décor, grands titres) | `#9B6B69` | 4,4:1 : jamais pour les petits textes |
| Rose foncé lisible (liens, petits textes) | `#7E5250` | 5,8:1 |
| Gris secondaire | `#5F5958` | jamais sur le rose poudré |
| Bordures | `#D8C8C6` | |

Polices : Poppins (titres) et Atkinson Hyperlegible (texte), auto-hébergées. Logo : équerre noire avec point rose foncé + « LE BON ANGLE » (CSS, classe `logo-mark`). Deux styles de boutons : `btn-primary` (rose poudré, contour noir) et `btn-secondary` (blanc, contour noir).

## 8. Tester en local et publier

```bash
cd le-bon-angle
python3 -m http.server 8000      # puis http://localhost:8000
```

Après modification de `style.css`, `config.js`, `main.js` ou `atelier.js` : remplacez `?v=10` par `?v=11` dans toutes les pages (rechercher-remplacer) pour vider le cache des navigateurs.

Publication : `git add -A && git commit -m "…" && git push` (GitHub Pages se met à jour en une à deux minutes).

La page 404 utilise des chemins en `/le-bon-angle/…`. Si vous passez sur un nom de domaine, remplacez ce préfixe par `/` dans `404.html`, et mettez à jour l'URL dans les balises `canonical` / `og:` des pages, `SITE_URL`, `sitemap.xml` et `robots.txt`. Ajoutez aussi le domaine à `ALLOWED_ORIGINS` du relais.

---

## Checklist de test avant publication

**Compréhension (test des 10 secondes)**
- [ ] Une personne extérieure dit ce que fait Le Bon Angle après 10 secondes sur l'accueil
- [ ] La différence entre l'analyse automatisée et l'accompagnement est claire (offres.html, comparatif)

**Prix**
- [ ] 12 € / 19 € · 149 € · 450 € · 690 € / 790 € partout (accueil, offres, accompagnement, analyse, FAQ)
- [ ] Même prix sur la page Payhip
- [ ] Changer un prix dans `config.js` → visible partout après rechargement

**Parcours Analyse**
- [ ] Bouton « Acheter mon analyse » → Payhip (nouvel onglet), code reçu par e-mail
- [ ] Dépôt PDF, .docx, .txt ; CV scanné → message invitant à coller le texte
- [ ] Erreurs : CV vide, code manquant, case non cochée, code invalide → message clair, focus sur le champ
- [ ] Analyse complète : synthèse, sommaire cliquable, blocs séparés
- [ ] Copier, Télécharger (.md), Imprimer / PDF fonctionnent
- [ ] « Réserver un débrief » et « Voir la refonte complète » mènent au bon endroit
- [ ] Code personnel (`ACCESS_CODE`) toujours accepté

**Liens**
- [ ] Tous les boutons d'accompagnement ouvrent le bon lien (Calendly ou lien propre)
- [ ] Menu, pied de page, ancres `#debrief`, `#refonte`, `#acceleration`
- [ ] Une adresse inexistante affiche la page 404

**Mobile et accessibilité**
- [ ] iPhone et Android réels : menu, bouton « Analyser » visible en haut, formulaire utilisable
- [ ] 320 px de large : aucun défilement horizontal (sauf le tableau comparatif, défilable)
- [ ] Navigation au clavier (Tab, Entrée, Échap ferme le menu), focus visible
- [ ] Zoom 200 %, test VoiceOver
- [ ] Lighthouse : Accessibilité ≥ 95, SEO ≥ 95

**SEO et partage**
- [ ] Aperçu LinkedIn (Post Inspector) avec la nouvelle image
- [ ] Sitemap soumis dans Google Search Console (facultatif)

**Légal**
- [ ] CGV couvrant aussi les accompagnements humains (aujourd'hui elles ne couvrent que l'analyse)
- [ ] Déduction de l'analyse sur le débrief mentionnée dans les CGV si elle est maintenue
- [ ] Relecture juridique des modifications signalées
