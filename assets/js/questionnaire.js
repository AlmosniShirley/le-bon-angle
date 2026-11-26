/* =====================================================================
   LE BON ANGLE — Questionnaire préparatoire (page questionnaire.html, non listée)
   1. Code personnel vérifié par le relais (POST /check), qui renvoie alors
      les questions (elles ne figurent pas dans le code public de la page)
   2. Brouillon enregistré dans le navigateur (localStorage) jusqu'à l'envoi
   3. Envoi au relais (POST /submit) : réponses, textes et fichiers d'origine.
      Le relais s'occupe de la synthèse (Dust) et de l'e-mail à Shirley.
   ===================================================================== */
(function () {
  "use strict";

  var C = window.QUESTIONNAIRE || {};
  var API = String(C.API_URL || "").trim().replace(/\/$/, "");
  var MAX_FICHIER = 5 * 1024 * 1024;
  var $ = function (id) { return document.getElementById(id); };
  var code = "", SECTIONS = [], DOCUMENTS = [];
  var fichiers = {};

  Array.prototype.forEach.call(document.querySelectorAll("[data-contact]"), function (a) { a.href = C.CONTACT || "index.html"; });

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text) e.textContent = text;
    return e;
  }
  function deux(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Construction du questionnaire ---------- */
  function construireFormulaire() {
    var num = 2;
    SECTIONS.forEach(function (s) {
      var fs = el("fieldset", { "class": "a-step" });
      var lg = el("legend");
      lg.appendChild(el("span", { "class": "n", "aria-hidden": "true" }, deux(num++)));
      lg.appendChild(document.createTextNode(" " + s.titre));
      fs.appendChild(lg);
      s.questions.forEach(function (q) {
        var b;
        if (q.type === "ouinon") {
          b = el("fieldset", { "class": "field", id: "bloc-" + q.id });
          b.appendChild(el("legend", { "class": "field-label" }, q.q));
          var r = el("div", { "class": "ouinon" });
          ["Oui", "Non"].forEach(function (v) {
            var l = el("label", { "class": "check" });
            l.appendChild(el("input", { type: "radio", name: "q-" + q.id, value: v, "data-q": q.id }));
            l.appendChild(el("span", null, v));
            r.appendChild(l);
          });
          b.appendChild(r);
        } else {
          b = el("div", { "class": "field", id: "bloc-" + q.id });
          b.appendChild(el("label", { "class": "field-label", "for": "q-" + q.id }, q.q));
          b.appendChild(el("textarea", { id: "q-" + q.id, rows: String(q.lignes || 3), "data-q": q.id }));
        }
        if (q.si) { b.setAttribute("data-si", q.si); b.hidden = true; }
        fs.appendChild(b);
      });
      $("sections").appendChild(fs);
    });
    $("num-docs").textContent = deux(num++);
    $("num-envoi").textContent = deux(num);

    DOCUMENTS.forEach(function (d) {
      var b = el("div", { "class": "doc-bloc", id: "bloc-doc-" + d.id });
      if (d.si) { b.setAttribute("data-si", d.si); b.hidden = true; }
      var h = el("h3", null, d.titre);
      if (d.aide) h.appendChild(el("span", { "class": "hint" }, d.aide));
      b.appendChild(h);
      var dz = el("div", { "class": "dropzone" });
      var lab = el("label", { "class": "dropzone-label", "for": "f-" + d.id });
      var s1 = el("span"); s1.appendChild(el("strong", null, "Choisir un fichier")); s1.appendChild(document.createTextNode(" ou le glisser ici"));
      lab.appendChild(s1);
      lab.appendChild(el("span", { "class": "hint" }, "PDF, Word (.docx) ou texte · 5 Mo maximum"));
      var inp = el("input", { type: "file", id: "f-" + d.id, accept: ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" });
      dz.appendChild(lab); dz.appendChild(inp); b.appendChild(dz);
      b.appendChild(el("p", { "class": "file-status", id: "st-" + d.id, role: "status", "aria-live": "polite" }));
      var f = el("div", { "class": "field" });
      var l = el("label", { "class": "field-label", "for": "t-" + d.id }, "Texte ou lien");
      l.appendChild(el("span", { "class": "hint" }, "Rempli automatiquement si tu déposes un fichier"));
      f.appendChild(l);
      f.appendChild(el("textarea", { id: "t-" + d.id, rows: "4", "data-doc": d.id }));
      b.appendChild(f);
      $("documents").appendChild(b);
      inp.addEventListener("change", function () { if (inp.files[0]) handleFile(inp.files[0], d.id); });
      ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.add("is-over"); }); });
      ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove("is-over"); }); });
    });
  }

  function majConditions() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-si]"), function (b) {
      var c = document.querySelector('input[name="q-' + b.getAttribute("data-si") + '"]:checked');
      b.hidden = !(c && c.value === "Oui");
    });
  }

  /* ---------- Lecture des fichiers ---------- */
  function readPdf(buf) {
    var pdfjs = window.pdfjsLib;
    if (!pdfjs) return Promise.resolve("");
    pdfjs.GlobalWorkerOptions.workerSrc = "assets/vendor/pdf.worker.min.js";
    return pdfjs.getDocument({ data: buf }).promise.then(function (pdf) {
      var pages = [];
      for (var i = 1; i <= pdf.numPages; i++) pages.push(i);
      return Promise.all(pages.map(function (n) {
        return pdf.getPage(n).then(function (p) { return p.getTextContent(); }).then(function (tc) {
          var lines = [], lastY = null, line = "";
          tc.items.forEach(function (it) {
            var y = Math.round(it.transform[5]);
            if (lastY !== null && Math.abs(y - lastY) > 2) { lines.push(line.trim()); line = ""; }
            line += it.str + (it.hasEOL ? "" : " ");
            lastY = y;
          });
          lines.push(line.trim());
          return lines.filter(Boolean).join("\n");
        });
      }));
    }).then(function (t) { return t.join("\n\n"); });
  }

  function toB64(buf) {
    var bytes = new Uint8Array(buf), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  function handleFile(file, id) {
    var st = $("st-" + id), name = (file.name || "").toLowerCase();
    if (file.size > MAX_FICHIER) { st.textContent = "Fichier trop lourd (5 Mo maximum)."; return; }
    if (name.endsWith(".doc")) { st.textContent = "Le format .doc n'est pas pris en charge : enregistre le document en .docx ou en PDF."; return; }
    st.textContent = "Lecture de « " + file.name + " »…";
    file.arrayBuffer().then(function (buf) {
      fichiers[id] = { name: file.name, b64: toB64(buf) };
      var copie = buf.slice(0);
      if (name.endsWith(".pdf") || file.type === "application/pdf") return readPdf(copie);
      if (name.endsWith(".docx") && window.mammoth) return window.mammoth.extractRawText({ arrayBuffer: copie }).then(function (r) { return r.value; });
      if (name.endsWith(".txt") || name.endsWith(".md") || file.type.indexOf("text/") === 0) return new TextDecoder().decode(copie);
      return "";
    }).then(function (text) {
      text = (text || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (text) $("t-" + id).value = text;
      st.textContent = "« " + file.name + " » ajouté." + (text.length < 200 ? " (Peu de texte lisible : le fichier me sera quand même transmis.)" : "");
      sauver();
    }).catch(function () {
      st.textContent = "« " + file.name + " » sera transmis, mais son texte n'a pas pu être lu.";
    });
  }

  /* ---------- Brouillon local ---------- */
  function cle() { return "lba-questionnaire-" + code; }
  function collecter() {
    var d = { nom: $("nom").value, email: $("email").value, q: {}, docs: {} };
    Array.prototype.forEach.call(document.querySelectorAll("textarea[data-q]"), function (t) { d.q[t.getAttribute("data-q")] = t.value; });
    Array.prototype.forEach.call(document.querySelectorAll("input[data-q]:checked"), function (i) { d.q[i.getAttribute("data-q")] = i.value; });
    Array.prototype.forEach.call(document.querySelectorAll("textarea[data-doc]"), function (t) { d.docs[t.getAttribute("data-doc")] = t.value; });
    return d;
  }
  var timer = null;
  function sauver() {
    if (!code) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      try {
        localStorage.setItem(cle(), JSON.stringify(collecter()));
        $("brouillon").textContent = "Brouillon enregistré sur cet appareil à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + ".";
      } catch (e) {}
    }, 600);
  }
  function restaurer() {
    var d;
    try { d = JSON.parse(localStorage.getItem(cle()) || "null"); } catch (e) { d = null; }
    if (!d) return;
    if (d.nom) $("nom").value = d.nom;
    if (d.email) $("email").value = d.email;
    Object.keys(d.q || {}).forEach(function (k) {
      var t = $("q-" + k);
      if (t && t.tagName === "TEXTAREA") t.value = d.q[k];
      var r = document.querySelector('input[name="q-' + k + '"][value="' + d.q[k] + '"]');
      if (r) r.checked = true;
    });
    Object.keys(d.docs || {}).forEach(function (k) { var t = $("t-" + k); if (t) t.value = d.docs[k]; });
    majConditions();
    $("brouillon").textContent = "Ton brouillon a été retrouvé. Les fichiers déposés sont à redéposer.";
  }
  $("form").addEventListener("input", sauver);
  $("form").addEventListener("change", function () { majConditions(); sauver(); });

  /* ---------- Appels au relais ---------- */
  function api(path, body) {
    return fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) throw new Error(data.error || "Le service est momentanément indisponible. Réessaie dans quelques minutes.");
          return data;
        });
      }, function () { throw new Error("Connexion impossible. Vérifie ta connexion Internet, puis réessaie."); });
  }
  function erreur(id, msg) { $(id).textContent = msg || ""; }

  /* ---------- Étape 1 : code ---------- */
  var urlCode = new URLSearchParams(location.search).get("code");
  if (urlCode) $("code").value = urlCode;

  $("code-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var c = $("code").value.trim().toUpperCase().replace(/\s+/g, "");
    if (!c) { erreur("code-error", "Saisis ton code."); return; }
    erreur("code-error", "");
    $("code-btn").disabled = true;
    api("/check", { code: c }).then(function (d) {
      code = c;
      SECTIONS = d.sections || []; DOCUMENTS = d.documents || [];
      construireFormulaire();
      $("code-form").hidden = true;
      $("form").hidden = false;
      var prenom = (d.nom || "").split(" ")[0];
      $("bonjour").textContent = prenom ? "Bonjour " + prenom + " !" : "Bonjour !";
      if (d.nom) $("nom").value = d.nom;
      restaurer();
      $("form").scrollIntoView({ behavior: "smooth" });
    }).catch(function (e) { erreur("code-error", e.message); }).then(function () { $("code-btn").disabled = false; });
  });

  /* ---------- Étape 3 : envoi ---------- */
  function masquer(t) { // l'agent IA n'a pas besoin des coordonnées
    return t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail masqué]")
      .replace(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g, "[téléphone masqué]");
  }
  function construire() {
    var d = collecter();
    var sections = SECTIONS.map(function (s) {
      return {
        titre: s.titre,
        questions: s.questions.filter(function (q) { return !q.si || d.q[q.si] === "Oui"; })
          .map(function (q) { return { q: q.q, r: (d.q[q.id] || "").trim() }; }),
      };
    });
    var docs = DOCUMENTS.filter(function (x) { return !x.si || d.q[x.si] === "Oui"; });
    var documents = docs.map(function (x) { return { titre: x.titre, texte: (d.docs[x.id] || "").trim() }; });
    var files = docs.map(function (x) { return fichiers[x.id]; }).filter(Boolean);

    var parts = ["Questionnaire préparatoire rempli par une personne accompagnée par Shirley, avant leur séance."];
    sections.forEach(function (s) {
      parts.push("## " + s.titre + "\n\n" + s.questions.map(function (q) {
        return "**" + q.q + "**\n" + (q.r ? masquer(q.r) : "_Pas de réponse._");
      }).join("\n\n"));
    });
    documents.forEach(function (x) { parts.push("## " + x.titre + "\n\n" + (x.texte ? masquer(x.texte) : "_Non fourni._")); });
    parts.push("Rédige pour Shirley, en français et en Markdown, la synthèse de ce questionnaire selon ta méthode, en une seule réponse complète.");
    return { nom: d.nom.trim(), email: d.email.trim(), sections: sections, documents: documents, files: files, message: parts.join("\n\n") };
  }

  $("form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var p = construire();
    var nbRep = p.sections.reduce(function (n, s) { return n + s.questions.filter(function (q) { return q.r; }).length; }, 0);
    if (!p.nom) return erreur("form-error", "Indique ton prénom et ton nom.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return erreur("form-error", "Indique une adresse e-mail valide.");
    if (nbRep < 5) return erreur("form-error", "Réponds au moins à quelques questions avant d'envoyer (même brièvement).");
    if (!$("consent").checked) return erreur("form-error", "Coche la case d'accord pour envoyer le questionnaire.");
    erreur("form-error", "");
    p.code = code;
    var btn = $("submit-btn");
    btn.disabled = true; btn.textContent = "Envoi en cours…";
    api("/submit", p).then(function () {
      try { localStorage.removeItem(cle()); } catch (e) {}
      $("form").hidden = true;
      $("merci").hidden = false;
      $("merci").focus();
      $("merci").scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function (e) {
      erreur("form-error", e.message + " Tes réponses sont conservées sur cet appareil.");
      btn.disabled = false; btn.textContent = "Envoyer mon questionnaire";
    });
  });
})();
