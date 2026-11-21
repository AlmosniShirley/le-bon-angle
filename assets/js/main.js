/* =====================================================================
   LE BON ANGLE — Script commun à toutes les pages
   1. Applique config.js (prix, liens, textes, emplacements)
   2. Menu mobile
   Aucune donnée n'est collectée ni stockée. Aucun traceur.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var CONFIG = window.SITE_CONFIG || {};
  var OFFRES = CONFIG.OFFRES || {};

  function str(v) {
    if (typeof v !== "string") return "";
    v = v.trim();
    return /^\[.*\]$/.test(v) ? "" : v;
  }
  function cfg(key) { return str(CONFIG[key]); }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  /* 12 → « 12 € » ; 1290 → « 1 290 € » (espaces insécables) */
  function euros(n) {
    if (n === 0) return "Gratuit";
    var s = Math.round(n * 100) % 100 ? n.toFixed(2).replace(".", ",") : String(Math.round(n));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
  }
  window.LBA_euros = euros;

  function markNewTab(link) {
    link.target = "_blank";
    link.rel = "noopener";
    if (!link.querySelector(".new-tab-hint")) {
      var hint = document.createElement("span");
      hint.className = "visually-hidden new-tab-hint";
      hint.textContent = " (nouvel onglet)";
      link.appendChild(hint);
    }
  }

  /* Lien d'une offre d'accompagnement : lien propre, sinon rendez-vous, sinon e-mail */
  function offerHref(key) {
    var o = OFFRES[key] || {};
    var own = str(o.lien);
    if (own) return own;
    if (cfg("LIEN_RDV")) return cfg("LIEN_RDV");
    if (cfg("EMAIL")) return "mailto:" + cfg("EMAIL") + "?subject=" + encodeURIComponent((o.nom || "Accompagnement") + " — Le Bon Angle");
    return "";
  }
  window.LBA_offerHref = offerHref;

  /* ---------- 1. Prix et offres ---------- */
  function applyOffers() {
    each("[data-prix]", function (el) {
      var o = OFFRES[el.getAttribute("data-prix")];
      if (o && isNum(o.prix)) el.textContent = euros(o.prix);
    });
    each("[data-prix-cible]", function (el) {
      var o = OFFRES[el.getAttribute("data-prix-cible")];
      if (o && isNum(o.prixCible)) el.textContent = euros(o.prixCible);
    });
    each("[data-if-prix-cible]", function (el) {
      var o = OFFRES[el.getAttribute("data-if-prix-cible")] || {};
      el.hidden = !(isNum(o.prixCible) && o.prixCible !== o.prix);
    });
    each("[data-mention]", function (el) {
      var o = OFFRES[el.getAttribute("data-mention")] || {};
      var m = str(o.mention);
      el.textContent = m;
      el.hidden = !m;
    });
    each("[data-precision]", function (el) {
      var o = OFFRES[el.getAttribute("data-precision")] || {};
      var p = str(o.precisionLancement);
      el.textContent = p;
      el.hidden = !p;
    });
    each("[data-offre-paiement]", function (el) {
      var o = OFFRES[el.getAttribute("data-offre-paiement")] || {};
      var p = str(o.paiement);
      el.textContent = p;
      el.hidden = !p;
    });
    var d = OFFRES.situer || {};
    each("[data-if-deduction]", function (el) { el.hidden = !d.deductionAnalyse; });
    each("[data-if-deduction-off]", function (el) { el.hidden = !!d.deductionAnalyse; });
    each("[data-deduction-jours]", function (el) { if (isNum(d.deductionJours)) el.textContent = String(d.deductionJours); });

    each("[data-offre-lien]", function (link) {
      var href = offerHref(link.getAttribute("data-offre-lien"));
      if (!href) return;
      link.setAttribute("href", href);
      if (/^https?:\/\//i.test(href)) markNewTab(link);
    });
    each("[data-contact=\"general\"]", function (link) {
      var email = cfg("EMAIL");
      if (!email) { link.hidden = true; return; }
      var body = "Bonjour Shirley,\n\nMa situation actuelle :\n\n\nCe que je cherche à clarifier ou à construire :\n\n\nCe que j'ai déjà essayé :\n\n\nLa formule qui m'attire le plus (si j'en ai une) :\n\n";
      link.setAttribute("href", "mailto:" + email + "?subject=" + encodeURIComponent("Le Bon Angle : prise de contact") + "&body=" + encodeURIComponent(body));
    });
    each("[data-contact-analyse]", function (link) {
      var email = cfg("EMAIL");
      if (!email) { link.hidden = true; return; }
      var body = "Bonjour Shirley,\n\nJ'ai fait l'Analyse Le Bon Angle et je souhaite être recontacté·e au sujet de mon analyse et de vos accompagnements.\n\nCe que je retiens de mon analyse, ou ma question :\n\n\nPrénom :\n";
      link.setAttribute("href", "mailto:" + email + "?subject=" + encodeURIComponent("Analyse Le Bon Angle : je souhaite être recontacté·e") + "&body=" + encodeURIComponent(body));
    });
    each("[data-rdv]", function (link) {
      var href = cfg("LIEN_RDV") || (cfg("EMAIL") ? "mailto:" + cfg("EMAIL") : "");
      if (!href) { link.hidden = true; return; }
      link.setAttribute("href", href);
      if (/^https?:\/\//i.test(href)) markNewTab(link);
    });
  }

  /* ---------- 2. Textes, liens, photo ---------- */
  function applyConfig() {
    each("[data-cfg-if]", function (el) { el.hidden = !cfg(el.getAttribute("data-cfg-if")); });
    each("[data-cfg-ifnot]", function (el) { el.hidden = !!cfg(el.getAttribute("data-cfg-ifnot")); });
    each("[data-cfg-text]", function (el) {
      var v = cfg(el.getAttribute("data-cfg-text"));
      if (v) el.textContent = v;
    });
    each("[data-cfg-href]", function (el) {
      var key = el.getAttribute("data-cfg-href");
      var v = cfg(key);
      if (!v) return;
      el.setAttribute("href", key === "EMAIL" ? "mailto:" + v : v);
      if (/^https?:\/\//i.test(v)) markNewTab(el);
    });

    each("[data-cfg-src]", function (img) {
      var src = cfg(img.getAttribute("data-cfg-src"));
      if (!src) return;
      var fig = img.closest("figure");
      img.addEventListener("load", function () {
        img.hidden = false;
        if (fig) fig.classList.add("has-photo");
        var ph = fig && fig.querySelector(".placeholder");
        if (ph) ph.hidden = true;
      });
      img.src = src;
    });

    if (CONFIG.AFFICHER_EMPLACEMENTS === false) root.classList.add("hide-placeholders");

    each("[data-year]", function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---------- 3. Données structurées (page d'accueil) ---------- */
  function structuredData() {
    var node = document.getElementById("ld-json");
    if (!node) return;
    try {
      var data = JSON.parse(node.textContent);
      if (cfg("SITE_URL")) data.url = cfg("SITE_URL");
      if (cfg("EMAIL")) data.email = cfg("EMAIL");
      var same = ["LIEN_LINKEDIN", "LIEN_YOUTUBE", "LIEN_BUILDRH"].map(cfg).filter(Boolean);
      if (same.length) data.sameAs = same;
      var items = [];
      ["analyse", "situer", "construire", "deployer"].forEach(function (k) {
        var o = OFFRES[k];
        if (o && isNum(o.prix)) items.push({ "@type": "Offer", name: o.nom, price: String(o.prix), priceCurrency: "EUR" });
      });
      if (items.length) data.hasOfferCatalog = { "@type": "OfferCatalog", name: "Offres Le Bon Angle", itemListElement: items };
      node.textContent = JSON.stringify(data);
    } catch (e) { /* on garde la version statique */ }
  }

  /* ---------- 4. Menu mobile ---------- */
  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;
    var label = toggle.querySelector(".menu-toggle-label");

    function setOpen(open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Fermer" : "Menu";
      if (!open && returnFocus) toggle.focus();
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false, true);
    });
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    var desktop = window.matchMedia("(min-width: 960px)");
    var onChange = function () { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  function init() {
    applyOffers();
    applyConfig();
    structuredData();
    initMenu();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
