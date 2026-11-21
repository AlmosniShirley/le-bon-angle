/* =====================================================================
   LE BON ANGLE — CONFIGURATION DU SITE
   ---------------------------------------------------------------------
   C'est LE fichier à modifier pour changer les prix, les liens de
   paiement, les liens de rendez-vous et les paramètres de l'analyse.

   Règles :
   - un texte laissé vide ("") est masqué proprement sur le site ;
   - un prix est un nombre sans guillemets (12, 149, 1290…) ;
   - aucune clé secrète ne doit JAMAIS être écrite ici (ce fichier est
     public). Les secrets restent dans le relais Cloudflare.

   Après modification : incrémenter ?v= dans les pages (voir README).
   ===================================================================== */

window.SITE_CONFIG = {

  /* ------------------------------------------------------------------
     1. LES OFFRES — prix en euros TTC
     ------------------------------------------------------------------ */
  OFFRES: {
    analyse: {
      nom: "Analyse Le Bon Angle",
      prix: 0,                       // 0 = gratuit (code obtenu sur e-mail via Payhip, produit à 0 €)
      prixCible: null,               // prix futur affiché ("Puis 19 €…") ; null = masqué
      mention: "",                   // affiché au-dessus du prix ("" pour masquer)
      // Précision factuelle sur le lancement, ex. "jusqu'au 31 janvier 2027"
      // ou "pour les 20 premiers clients". Vide = rien d'affiché.
      precisionLancement: "",
      // Page Payhip (produit à 0 €) : la personne donne son e-mail et reçoit son code
      lienPaiement: "https://payhip.com/b/k5c6D"
    },

    /* Les trois accompagnements humains (prix en euros TTC).
       lien : réservation ou paiement propre à l'offre ; vide = LIEN_RDV.
       paiement : texte affiché sous le prix ("" pour masquer). */
    situer: {
      nom: "Se situer — Le débrief humain de votre trajectoire",
      prix: 129,
      mention: "",
      paiement: "",
      lien: "",
      deductionAnalyse: false,       // sans objet : l'analyse est gratuite
      deductionJours: 7
    },

    construire: {
      nom: "Construire — La feuille de route professionnelle",
      prix: 390,
      mention: "",
      paiement: "",
      lien: ""
    },

    deployer: {
      nom: "Déployer — Le parcours de mise en mouvement",
      prix: 690,
      prixCible: null,
      mention: "",
      precisionLancement: "",
      paiement: "",
      lien: ""
    }
  },

  /* ------------------------------------------------------------------
     2. RENDEZ-VOUS ET CONTACT
     ------------------------------------------------------------------ */
  /* Lien de prise de rendez-vous utilisé par tous les boutons
     d'accompagnement qui n'ont pas de lien propre. */
  LIEN_RDV: "https://calendly.com/shirley-chiche-buildrh/call-decouverte",

  /* Adresse e-mail publique (vide = non affichée). Si LIEN_RDV est vide,
     les boutons ouvrent un e-mail vers cette adresse. */
  EMAIL: "shirley.chiche@buildrh.co",

  LIEN_LINKEDIN: "",
  LIEN_BUILDRH: "https://build-rh.io",
  LIEN_BLOG: "https://prompt-humain.ghost.io",
  LIEN_YOUTUBE: "https://www.youtube.com/@TDArHH",
  LIEN_RESSOURCES: "https://almosnishirley.github.io/bibliotheque-ressources/",

  /* Chemin de la photo de Shirley, ex. "assets/images/shirley.jpg"
     (portrait 4:5, environ 800 × 1000 px, < 200 Ko). Vide = emplacement. */
  PHOTO: "",

  /* Réponse FAQ « Les rendez-vous sont-ils en visio ? » (vide = réponse neutre) */
  FAQ_VISIO: "",

  /* true  = les emplacements [TÉMOIGNAGE À AJOUTER], [PHOTO…] sont visibles
     false = ils sont masqués (à utiliser tant qu'ils ne sont pas remplis,
             si vous ne voulez pas les montrer aux visiteurs) */
  AFFICHER_EMPLACEMENTS: false,

  /* URL publique du site (données structurées, sitemap) */
  SITE_URL: "https://almosnishirley.github.io/le-bon-angle/",

  /* ------------------------------------------------------------------
     3. ANALYSE — paramètres techniques de l'agent
     ------------------------------------------------------------------ */
  ATELIER: {
    /* Adresse du relais Cloudflare Worker (worker/src/index.js).
       Vide = la page affiche « L'analyse n'est pas encore ouverte ». */
    API_URL: "https://plain-frost-72f7.shirley-chiche.workers.dev",

    /* true = le code d'analyse (clé de licence Payhip ou code personnel)
       est obligatoire. Doit correspondre à la configuration du relais. */
    CODE_REQUIS: true,

    /* Limites (doivent rester cohérentes avec le relais) */
    MAX_CARACTERES: 40000,
    ATTENTE_MAX_MINUTES: 5
  },

  /* ------------------------------------------------------------------
     4. INFORMATIONS LÉGALES (mentions légales, CGV)
     ------------------------------------------------------------------ */
  SOCIETE: "BUILD RH",
  STATUT_JURIDIQUE: "EURL au capital de 1 500 €",
  RCS: "RCS Nanterre 839 929 528 · NAF 7022Z",
  SIRET: "839 929 528 00017",
  TVA_INTRA: "FR 02 839 929 528",
  DIRECTION: "Shirley Almosni Chiche, gérante",
  ADRESSE: "1 Allée des Châtaigniers, 92410 Ville-d'Avray",
  MEDIATEUR: "CM2C (Centre de la Médiation de la Consommation de Conciliateurs de Justice), saisine en ligne sur https://cm2c.net"
};
