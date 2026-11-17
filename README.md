# Le Bon Angle — site vitrine

Site one-page statique (HTML, CSS, JavaScript vanilla), sans dépendance, sans base de données, sans cookie. Déployé automatiquement sur GitHub Pages.

## Structure

```
le-bon-angle/
├── index.html               Page principale (tous les textes)
├── config.js                ← Variables à personnaliser (nom, liens, photo…)
├── styles.css               Styles (palette en haut du fichier)
├── script.js                Application de la config + menu mobile
├── mentions-legales.html    Mentions légales (remplies depuis config.js)
├── confidentialite.html     Politique de confidentialité
├── favicon.svg              Icône
├── robots.txt
├── assets/                  Photo et images
└── .github/workflows/deploy.yml   Déploiement automatique
```

---

## 1. Remplacer les liens et informations personnelles

Tout se passe dans **`config.js`**. Chaque variable demandée correspond à un champ :

| Variable              | Champ dans `config.js`           | Exemple                                  |
|-----------------------|----------------------------------|------------------------------------------|
| `[NOM]`               | `NOM`                            | `"Camille Martin"`                       |
| `[EMAIL]`             | `EMAIL`                          | `"contact@lebonangle.fr"`                |
| `[LIEN_CALENDLY_OU_FORMULAIRE]` | `LIEN_CALENDLY_OU_FORMULAIRE` | `"https://calendly.com/…"`          |
| `[LIEN_LINKEDIN]`     | `LIEN_LINKEDIN`                  | `"https://www.linkedin.com/in/…"`        |
| `[PHOTO]`             | `PHOTO`                          | `"assets/photo.jpg"`                     |
| `[LOCALISATION]`      | `LOCALISATION`                   | `"Lyon · en visio partout en France"`    |
| `[MENTIONS_LEGALES]`  | `MENTIONS_LEGALES`               | `"mentions-legales.html"` (par défaut)   |

Champs complémentaires : `BIO` (courte biographie), `FAQ_VISIO` (réponse à la question sur la visio), `SITE_URL`, `STATUT_JURIDIQUE`, `SIRET`, `ADRESSE`.

**Règle :** un champ vide (`""`) est masqué automatiquement. Aucun texte de démonstration ni crochet `[…]` n'apparaît sur le site.

**Boutons de rendez-vous :** tous les boutons (header, hero, cartes d'offres, CTA final) utilisent `LIEN_CALENDLY_OU_FORMULAIRE`. S'il est vide, ils ouvrent un e-mail vers `EMAIL`. Les liens externes s'ouvrent dans un nouvel onglet.

## 2. Modifier les textes

Tous les textes sont dans **`index.html`**, découpé en blocs commentés :

```html
<!-- ============================= HERO ============================= -->
```

Cherchez la phrase à modifier (Ctrl/Cmd + F) et remplacez-la directement. Les **prix** apparaissent à trois endroits : les cartes d'offres, la réponse FAQ « Peut-on payer en plusieurs fois ? » et le bloc `application/ld+json` dans le `<head>`. Pensez à les modifier partout.

Les **couleurs** sont définies en haut de `styles.css` (`:root`).
Attention : `--rose` (#B96F73) n'est utilisé que pour la décoration, car son contraste est insuffisant pour du texte. Les textes roses utilisent `--rose-text` (#9A4F54).

## 3. Ajouter la photo

1. Préparez une photo portrait (ratio 4:5, environ 800 × 1000 px, JPG ou WebP, moins de 200 Ko).
2. Placez-la dans `assets/`, par exemple `assets/photo.jpg`.
3. Dans `config.js` : `PHOTO: "assets/photo.jpg"`.

Le texte alternatif reprend automatiquement `NOM`. Sans photo, un motif graphique neutre s'affiche à la place.

## 4. Lancer le site en local

Aucune installation nécessaire. Depuis le dossier du projet :

```bash
python3 -m http.server 8000
```

puis ouvrez <http://localhost:8000>. (Ouvrir `index.html` directement par double-clic fonctionne aussi.)

## 5. Activer GitHub Pages

1. Créez un dépôt sur GitHub et poussez le projet sur la branche `main` :
   ```bash
   git init
   git add .
   git commit -m "Site Le Bon Angle"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/le-bon-angle.git
   git push -u origin main
   ```
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` se lance à chaque push sur `main` (onglet **Actions**). L'URL du site s'affiche à la fin : `https://VOTRE-COMPTE.github.io/le-bon-angle/`.
4. **Nom de domaine personnalisé (optionnel)** : créez à la racine un fichier `CNAME` contenant uniquement le domaine (ex. `lebonangle.fr`), configurez le DNS chez votre registrar, puis renseignez le domaine dans **Settings → Pages → Custom domain** et cochez **Enforce HTTPS**.

### Après la mise en ligne : SEO

Les robots des réseaux sociaux ne lisent pas `config.js`. Dans le `<head>` de `index.html`, décommentez et complétez :

```html
<meta property="og:url" content="https://VOTRE-DOMAINE/">
<meta property="og:image" content="https://VOTRE-DOMAINE/assets/og-image.png">
```

et ajoutez `<link rel="canonical" href="https://VOTRE-DOMAINE/">`. Pour une image de partage, créez `assets/og-image.png` en 1200 × 630 px et passez `twitter:card` à `summary_large_image`.

---

## Checklist avant mise en ligne

**Contenus**
- [ ] `config.js` rempli : `NOM`, `EMAIL`, `LIEN_CALENDLY_OU_FORMULAIRE`, `LIEN_LINKEDIN`, `LOCALISATION`, `SITE_URL`
- [ ] Photo ajoutée dans `assets/` et référencée dans `PHOTO`
- [ ] `BIO` rédigée (2 à 3 phrases)
- [ ] Réponse `FAQ_VISIO` rédigée
- [ ] Prix vérifiés aux trois endroits (cartes, FAQ, données structurées)
- [ ] Relecture orthographique complète
- [ ] Aucune promesse de placement, aucun chiffre ni témoignage non vérifié

**Légal**
- [ ] `STATUT_JURIDIQUE`, `SIRET`, `ADRESSE` renseignés (obligatoires pour les mentions légales)
- [ ] Politique de confidentialité relue et adaptée à l'outil de rendez-vous choisi
- [ ] Mention de la TVA vérifiée (si micro-entreprise en franchise : prix « TTC » = prix net, ajouter « TVA non applicable, art. 293 B du CGI » si besoin)
- [ ] Conditions générales de vente prévues (communiquées avant tout paiement)

**Liens et boutons**
- [ ] Chaque bouton « Réserver / Choisir cette offre / Parler de ma situation » ouvre bien l'outil de rendez-vous
- [ ] Liens LinkedIn, e-mail, mentions légales, confidentialité fonctionnels
- [ ] Navigation du header : chaque lien mène à la bonne section

**Accessibilité**
- [ ] Navigation complète au clavier (Tab, Maj+Tab, Entrée, Échap pour fermer le menu)
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Lien d'évitement « Aller au contenu » visible au premier Tab
- [ ] Test avec un lecteur d'écran (VoiceOver sur Mac/iPhone, NVDA sur Windows)
- [ ] Zoom à 200 % sans perte de contenu
- [ ] Audit Lighthouse (Chrome DevTools) : Accessibilité ≥ 95

**Technique**
- [ ] Test sur Chrome, Safari, Firefox, Edge
- [ ] Test mobile réel (iPhone + Android) : menu, lisibilité, boutons
- [ ] Balises `og:url`, `og:image`, `canonical` complétées
- [ ] Aperçu de partage vérifié (LinkedIn Post Inspector)
- [ ] Données structurées validées (<https://validator.schema.org>)
- [ ] Workflow GitHub Actions passé au vert, HTTPS actif

## Éléments encore à personnaliser

1. Prénom et nom (`NOM`)
2. Adresse e-mail (`EMAIL`)
3. Lien Calendly ou formulaire (`LIEN_CALENDLY_OU_FORMULAIRE`)
4. Lien LinkedIn (`LIEN_LINKEDIN`)
5. Photo (`PHOTO` + fichier dans `assets/`)
6. Localisation (`LOCALISATION`)
7. Courte biographie (`BIO`)
8. Réponse FAQ sur la visioconférence (`FAQ_VISIO`)
9. URL du site (`SITE_URL` + balises `og:url` / `canonical` dans `index.html`)
10. Informations légales (`STATUT_JURIDIQUE`, `SIRET`, `ADRESSE`)
11. Image de partage `assets/og-image.png` (1200 × 630 px)
12. Nom de domaine (fichier `CNAME`, optionnel)
