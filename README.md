# Le Bon Angle — site vitrine

**Design de carrière et de rôle pour professionnels Tech en transformation.**

Site one-page statique (HTML, CSS, JavaScript vanilla). Pas de build, pas de dépendance, pas de base de données, pas de cookie. Hébergé sur GitHub Pages.

En ligne : <https://almosnishirley.github.io/le-bon-angle/>

## Structure

```
le-bon-angle/
├── index.html               Page principale (tous les textes)
├── config.js                ← Variables à personnaliser (nom, liens, photo…)
├── styles.css               Styles (palette Build RH en haut du fichier)
├── script.js                Application de la config + menu mobile
├── mentions-legales.html    Mentions légales (remplies depuis config.js)
├── confidentialite.html     Politique de confidentialité
├── favicon.svg              Icône
├── robots.txt
├── assets/
│   ├── fonts/               Poppins + Atkinson Hyperlegible (auto-hébergées)
│   └── og-image.png         Image de partage 1200 × 630
└── .github/workflows/deploy.yml   Déploiement par GitHub Actions (optionnel, voir § 5)
```

Ordre des sections de la page : Hero · Est-ce que cela vous parle ? · Design de rôle · Notre méthode · Les accompagnements · Neuroatypisme · À propos · Ce que nous ne promettons pas · FAQ · CTA final.

---

## 1. Variables à compléter (`config.js`)

Tout le contenu personnel est centralisé dans **`config.js`**. Un champ vide (`""`) est masqué automatiquement : aucun crochet `[…]` ni texte de démonstration n'apparaît sur le site.

| Variable du brief               | Champ dans `config.js`        | Statut                     |
|---------------------------------|-------------------------------|----------------------------|
| `[NOM]`                         | `NOM`                         | à compléter                |
| `[EMAIL]`                       | `EMAIL`                       | à compléter                |
| `[LIEN_CALENDLY_OU_FORMULAIRE]` | `LIEN_CALENDLY_OU_FORMULAIRE` | **à compléter en priorité** |
| `[LIEN_LINKEDIN]`               | `LIEN_LINKEDIN`               | à compléter                |
| `[PHOTO]`                       | `PHOTO`                       | à compléter                |
| `[LOCALISATION]`                | `LOCALISATION`                | à compléter                |
| `[MENTIONS_LEGALES]`            | `MENTIONS_LEGALES`            | `mentions-legales.html` (par défaut) |

Champs complémentaires :

| Champ              | Usage                                                         | Statut |
|--------------------|---------------------------------------------------------------|--------|
| `BIO`              | Courte biographie sous « À propos »                           | à compléter |
| `FAQ_VISIO`        | Réponse à « Les rendez-vous sont-ils en visioconférence ? » (sinon : réponse neutre) | à compléter |
| `SITE_URL`         | URL publique (données structurées)                            | rempli |
| `STATUT_JURIDIQUE`, `SIRET`, `ADRESSE` | Mentions légales (obligatoires)           | à compléter |

**CTA unique :** tous les boutons « Parler de ma situation » (header, hero, quatre cartes, CTA final) pointent vers `LIEN_CALENDLY_OU_FORMULAIRE`. Tant qu'il est vide, ils ouvrent un e-mail vers `EMAIL`. Si les deux sont vides, ils renvoient vers le bloc final de la page.

## 2. Modifier les textes

Tous les textes sont dans **`index.html`**, en blocs commentés (`<!-- ===== HERO ===== -->`, etc.). Cherchez la phrase (Cmd/Ctrl + F) et remplacez-la.

Les **prix** apparaissent à trois endroits : les cartes d'offres, la réponse FAQ « Peut-on payer en plusieurs fois ? » et le bloc `application/ld+json` dans le `<head>`.

### Palette et contrastes

Définie en haut de `styles.css` (`:root`) :

| Rôle | Couleur | Remarque |
|---|---|---|
| Rose poudré (blocs, CTA) | `#E7C2C0` | texte toujours noir dessus |
| Rose très clair (fonds) | `#F8EFEE` | |
| Noir | `#171717` | |
| Blanc | `#FFFFFF` | |
| Accent rose foncé | `#9B6B69` | **contraste 4,4:1 : réservé aux décors et grands textes** (sous-titre du hero) |
| Accent lisible (petits textes) | `#7E5250` | ajouté pour respecter le WCAG AA (≥ 5,8:1) |
| Gris secondaire | `#5F5958` | jamais posé sur le rose poudré |
| Bordures | `#D8C8C6` | |

Polices : **Poppins** (titres) et **Atkinson Hyperlegible** (texte, conçue pour la lisibilité), auto-hébergées dans `assets/fonts/`, sans appel à Google.

## 3. Ajouter la photo

1. Photo portrait (ratio 4:5, environ 800 × 1000 px, JPG ou WebP, moins de 200 Ko).
2. Placez-la dans `assets/`, par exemple `assets/photo.jpg`.
3. Dans `config.js` : `PHOTO: "assets/photo.jpg"`.

Le texte alternatif reprend `NOM`. Sans photo, un bloc rose avec la marque s'affiche.

## 4. Développement local

Aucune installation ni build nécessaire.

```bash
cd le-bon-angle
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Après une modification de `styles.css`, `script.js` ou `config.js`, incrémentez le `?v=` correspondant dans les trois fichiers HTML (`?v=2` → `?v=3`) pour éviter que les navigateurs gardent l'ancienne version en cache.

## 5. Déploiement

**Mode actuel : publication depuis la branche `main`** (Settings → Pages → Source : *Deploy from a branch*, `main` / root).

```bash
git add .
git commit -m "Description de la modification"
git push
```

Le site est mis à jour en une à deux minutes (onglet **Actions** du dépôt pour suivre).

**Option : GitHub Actions.** Le workflow `.github/workflows/deploy.yml` publie uniquement les fichiers du site (pas le README). Il n'est pas encore poussé car le jeton GitHub local n'a pas le droit `workflow`. Pour l'activer :

```bash
gh auth refresh -s workflow
git add .github && git commit -m "Ajout du workflow de déploiement" && git push
```

puis Settings → Pages → Source : **GitHub Actions**.

**Nom de domaine (optionnel)** : fichier `CNAME` à la racine contenant le domaine, DNS chez le registrar, puis Settings → Pages → Custom domain + Enforce HTTPS. Mettez ensuite à jour l'URL dans `index.html` (`canonical`, `og:url`, `og:image`, JSON-LD) et `SITE_URL` dans `config.js`.

---

## Checklist QA avant publication

**Contenus et positionnement**
- [ ] Le hero annonce « design de carrière et de rôle » ; « agent de carrière » n'apparaît que comme explication secondaire
- [ ] Aucun texte de l'ancien positionnement (« Agent de carrière pour profils Tech », « Réserver un échange », « Choisir cette offre »)
- [ ] Aucun témoignage, logo client, chiffre de résultat ou promesse de placement
- [ ] Relecture orthographique complète

**Tarifs**
- [ ] DÉCLIC 150 € TTC · 90 minutes
- [ ] SIGNATURE 390 € TTC · 2 à 3 semaines
- [ ] TRAJECTOIRE 790 € TTC · 8 semaines · 2 × 395 € TTC
- [ ] AGENT 1 290 € TTC · 12 semaines · 3 × 430 € TTC
- [ ] Mêmes montants dans la FAQ et les données structurées
- [ ] Mention TVA vérifiée (micro-entreprise en franchise : ajouter « TVA non applicable, art. 293 B du CGI » si besoin)

**Liens**
- [ ] Les 7 boutons « Parler de ma situation » ouvrent l'outil de rendez-vous (nouvel onglet)
- [ ] Les 5 liens du menu mènent à la bonne section, « Découvrir la méthode » mène à la méthode
- [ ] LinkedIn, e-mail, mentions légales, confidentialité fonctionnels

**Mobile**
- [ ] iPhone et Android réels : menu (ouvrir, naviguer, fermer), lisibilité, boutons faciles à toucher
- [ ] Largeur 320 px : aucun défilement horizontal
- [ ] Tablette (768 px) : offres sur deux colonnes

**Accessibilité**
- [ ] Navigation complète au clavier (Tab, Maj+Tab, Entrée, Échap ferme le menu)
- [ ] Focus visible partout (contour noir)
- [ ] Lien « Aller au contenu » visible au premier Tab
- [ ] FAQ ouvrable au clavier (Entrée / Espace)
- [ ] Test lecteur d'écran (VoiceOver, NVDA)
- [ ] Zoom 200 % sans perte de contenu
- [ ] Lighthouse : Accessibilité ≥ 95

**SEO**
- [ ] Title : « Le Bon Angle | Design de carrière et de rôle pour professionnels Tech »
- [ ] Meta description à jour
- [ ] Une seule balise H1
- [ ] Aperçu de partage vérifié (LinkedIn Post Inspector)
- [ ] Données structurées validées (<https://validator.schema.org>)

**Légal**
- [ ] `STATUT_JURIDIQUE`, `SIRET`, `ADRESSE` renseignés
- [ ] Politique de confidentialité adaptée à l'outil de rendez-vous choisi
- [ ] Conditions générales de vente prévues avant tout paiement
