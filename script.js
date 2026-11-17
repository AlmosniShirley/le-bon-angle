/* =====================================================================
   LE BON ANGLE — Script
   1. Applique la configuration (config.js) aux éléments de la page
   2. Gère le menu mobile
   Aucune donnée n'est collectée ni stockée.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var CONFIG = window.SITE_CONFIG || {};

  /* Renvoie la valeur d'un champ, ou "" s'il est vide
     ou s'il contient encore un marqueur du type [NOM]. */
  function cfg(key) {
    var v = CONFIG[key];
    if (typeof v !== "string") return "";
    v = v.trim();
    if (!v || /^\[.*\]$/.test(v)) return "";
    return v;
  }

  function isExternal(url) {
    return /^https?:\/\//i.test(url);
  }

  function toHref(key, value) {
    if (key === "EMAIL") return "mailto:" + value;
    return value;
  }

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

  /* --- 1. Configuration --- */
  function applyConfig() {
    // Afficher / masquer selon qu'un champ est rempli
    document.querySelectorAll("[data-cfg-if]").forEach(function (el) {
      el.hidden = !cfg(el.getAttribute("data-cfg-if"));
    });
    document.querySelectorAll("[data-cfg-ifnot]").forEach(function (el) {
      el.hidden = !!cfg(el.getAttribute("data-cfg-ifnot"));
    });

    // Textes
    document.querySelectorAll("[data-cfg-text]").forEach(function (el) {
      var v = cfg(el.getAttribute("data-cfg-text"));
      if (v) el.textContent = v;
    });

    // Liens
    document.querySelectorAll("[data-cfg-href]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-href");
      var v = cfg(key);
      if (v) el.setAttribute("href", toHref(key, v));
    });

    // Photo
    var photoFigure = document.querySelector(".about-photo");
    document.querySelectorAll("[data-cfg-src]").forEach(function (img) {
      var src = cfg(img.getAttribute("data-cfg-src"));
      if (!src) return;
      var altKey = img.getAttribute("data-cfg-alt");
      img.alt = altKey && cfg(altKey) ? cfg(altKey) : "Portrait de la fondatrice du Bon Angle";
      img.addEventListener("load", function () {
        img.hidden = false;
        if (photoFigure) photoFigure.classList.add("has-photo");
      });
      img.src = src;
    });

    // Boutons de prise de rendez-vous
    var booking = cfg("LIEN_CALENDLY_OU_FORMULAIRE");
    var email = cfg("EMAIL");
    var bookingHref = booking || (email ? "mailto:" + email + "?subject=" +
      encodeURIComponent("Échange découverte — Le Bon Angle") : "");

    if (bookingHref) {
      document.querySelectorAll("[data-booking]").forEach(function (link) {
        link.setAttribute("href", bookingHref);
        if (isExternal(bookingHref)) markNewTab(link);
      });
    } else if (window.console) {
      console.warn("[Le Bon Angle] LIEN_CALENDLY_OU_FORMULAIRE et EMAIL sont vides dans config.js.");
    }

    // Année du footer
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    enrichStructuredData();
  }

  /* Complète les données structurées avec les seuls champs renseignés */
  function enrichStructuredData() {
    var node = document.getElementById("ld-json");
    if (!node) return;
    try {
      var data = JSON.parse(node.textContent);
      if (cfg("SITE_URL")) data.url = cfg("SITE_URL");
      if (cfg("EMAIL")) data.email = cfg("EMAIL");
      if (cfg("LIEN_LINKEDIN")) data.sameAs = [cfg("LIEN_LINKEDIN")];
      if (cfg("NOM")) data.founder = { "@type": "Person", name: cfg("NOM") };
      if (cfg("LOCALISATION")) data.areaServed = cfg("LOCALISATION");
      if (cfg("PHOTO") && cfg("SITE_URL")) {
        data.image = cfg("SITE_URL").replace(/\/$/, "") + "/" + cfg("PHOTO").replace(/^\//, "");
      }
      node.textContent = JSON.stringify(data);
    } catch (e) { /* JSON invalide : on laisse la version statique */ }
  }

  /* --- 2. Menu mobile --- */
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

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Fermer après un clic sur un lien
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    // Fermer avec Échap
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false, true);
      }
    });

    // Fermer si on clique en dehors
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" &&
          !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });

    // Réinitialiser en passant en affichage bureau
    var desktop = window.matchMedia("(min-width: 900px)");
    var onChange = function () { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  function init() {
    applyConfig();
    initMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
