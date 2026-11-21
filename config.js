/* =====================================================================
   LE BON ANGLE — CONFIGURATION DU SITE
   ---------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour personnaliser les liens,
   le nom, la photo, etc.

   Règle simple : un champ laissé vide ("") est masqué proprement sur
   le site. Aucun texte de démonstration n'apparaît jamais.
   ===================================================================== */

window.SITE_CONFIG = {
  /* [NOM] — Prénom et nom, ex. "Camille Martin" */
  NOM: "",

  /* [EMAIL] — Adresse de contact, ex. "contact@lebonangle.fr" */
  EMAIL: "",

  /* [LIEN_CALENDLY_OU_FORMULAIRE] — Lien de prise de rendez-vous.
     Tous les boutons « Parler de ma situation » (header, hero,
     cartes d'offres, CTA final) pointent ici.
     Si vide : les boutons ouvrent un e-mail vers EMAIL. */
  LIEN_CALENDLY_OU_FORMULAIRE: "",

  /* [LIEN_LINKEDIN] — URL complète du profil LinkedIn */
  LIEN_LINKEDIN: "",

  /* [PHOTO] — Chemin de la photo, ex. "assets/photo.jpg"
     (format portrait conseillé, 800 × 1000 px, < 200 Ko) */
  PHOTO: "",

  /* [LOCALISATION] — Ville ou zone, ex. "Lyon · en visio partout en France" */
  LOCALISATION: "",

  /* [MENTIONS_LEGALES] — Lien vers la page de mentions légales.
     Par défaut : la page fournie avec le site. */
  MENTIONS_LEGALES: "mentions-legales.html",

  /* Courte biographie affichée dans « À propos » (2 à 3 phrases) */
  BIO: "",

  /* Réponse FAQ « Les rendez-vous sont-ils en visioconférence ? »
     Si vide, une réponse neutre est affichée. */
  FAQ_VISIO: "",

  /* URL publique du site, ex. "https://lebonangle.fr"
     (utilisée pour les données structurées) */
  SITE_URL: "https://almosnishirley.github.io/le-bon-angle/",

  /* --- Informations légales (page mentions-legales.html) --- */
  STATUT_JURIDIQUE: "", /* ex. "Entreprise individuelle (micro-entreprise)" */
  SIRET: "",
  ADRESSE: "",          /* adresse professionnelle ou de domiciliation */

  /* --- L'Atelier (atelier.html) --- */
  /* Adresse du relais Cloudflare Worker, ex.
     "https://le-bon-angle-atelier.VOTRE-SOUS-DOMAINE.workers.dev"
     Si vide : la page Atelier affiche « pas encore ouvert ». */
  ATELIER_API_URL: "https://plain-frost-72f7.shirley-chiche.workers.dev",

  /* true = les candidats doivent saisir un code d'accès
     (à définir côté relais avec : npx wrangler secret put ACCESS_CODE) */
  ATELIER_ACCESS_CODE_REQUIRED: true
};
