/* =====================================================================
   LE BON ANGLE — Analyse (page atelier.html)
   1. Lecture du CV dans le navigateur (PDF, DOCX, TXT)
   2. Envoi au relais Cloudflare Worker, qui transmet à l'agent Dust
      (POST /analyze puis GET /result : contrat inchangé)
   3. Attente puis affichage du résultat (Markdown nettoyé par DOMPurify)
   Rien n'est stocké par ce site : ni cookie, ni localStorage.
   ===================================================================== */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var A = CONFIG.ATELIER || {};
  var API = String(A.API_URL || CONFIG.ATELIER_API_URL || "").trim().replace(/\/$/, "");
  var CODE_REQUIS = A.CODE_REQUIS !== undefined ? !!A.CODE_REQUIS : !!CONFIG.ATELIER_ACCESS_CODE_REQUIRED;
  var MAX_CHARS = A.MAX_CARACTERES || 40000;
  var POLL_MS = 4000;
  var POLL_MAX = Math.round(((A.ATTENTE_MAX_MINUTES || 5) * 60000) / POLL_MS);

  var $ = function (id) { return document.getElementById(id); };
  var form, fileInput, cvText, fileStatus, cvCount, errorBox, submitBtn;
  var lastMarkdown = "";
  var lastRequest = {};

  /* ---------- 1. Lecture du fichier ---------- */
  function readPdf(file) {
    var pdfjs = window.pdfjsLib;
    if (!pdfjs) return Promise.reject(new Error("Lecteur PDF indisponible. Collez le texte de votre CV dans le champ prévu."));
    pdfjs.GlobalWorkerOptions.workerSrc = "assets/vendor/pdf.worker.min.js";
    return file.arrayBuffer().then(function (buf) {
      return pdfjs.getDocument({ data: buf }).promise;
    }).then(function (pdf) {
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
    }).then(function (texts) { return texts.join("\n\n"); });
  }

  function readDocx(file) {
    if (!window.mammoth) return Promise.reject(new Error("Lecteur Word indisponible. Collez le texte de votre CV dans le champ prévu."));
    return file.arrayBuffer().then(function (buf) {
      return window.mammoth.extractRawText({ arrayBuffer: buf });
    }).then(function (r) { return r.value; });
  }

  function readFile(file) {
    var name = (file.name || "").toLowerCase();
    if (file.size > 10 * 1024 * 1024) return Promise.reject(new Error("Fichier trop lourd (10 Mo maximum)."));
    if (name.endsWith(".pdf") || file.type === "application/pdf") return readPdf(file);
    if (name.endsWith(".docx")) return readDocx(file);
    if (name.endsWith(".txt") || name.endsWith(".md") || file.type.indexOf("text/") === 0) return file.text();
    if (name.endsWith(".doc")) return Promise.reject(new Error("Le format .doc n'est pas pris en charge : enregistrez le CV en .docx ou en PDF."));
    return Promise.reject(new Error("Format non pris en charge. Utilisez un PDF, un .docx ou un fichier texte."));
  }

  function handleFile(file) {
    if (!file) return;
    fileStatus.textContent = "Lecture de « " + file.name + " »…";
    readFile(file).then(function (text) {
      text = (text || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      fileStatus.textContent = text.length < 200
        ? "Peu de texte trouvé. S'il s'agit d'un CV scanné ou en image, copiez-collez son texte ci-dessous."
        : "« " + file.name + " » lu. Relisez le texte ci-dessous avant l'envoi : c'est exactement ce qui sera transmis.";
      cvText.value = text;
      updateCount();
    }).catch(function (e) {
      fileStatus.textContent = e.message || "Impossible de lire ce fichier.";
    });
  }

  function updateCount() {
    var n = cvText.value.trim().length;
    cvCount.textContent = n ? n.toLocaleString("fr-FR") + " caractères" + (n > MAX_CHARS ? " — trop long, " + MAX_CHARS.toLocaleString("fr-FR") + " maximum" : "") : "";
  }

  /* ---------- 2. Construction du message ---------- */
  function redact(text) {
    return text
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail masqué]")
      .replace(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g, "[téléphone masqué]")
      .replace(/\+\d{1,3}[\s.-]?\d(?:[\s.-]?\d){6,12}/g, "[téléphone masqué]");
  }

  function val(id) { var el = $(id); return el ? el.value.trim() : ""; }
  function selectedText(id) {
    var el = $(id);
    if (!el || !el.value) return "";
    return el.options[el.selectedIndex].text;
  }
  function attente() {
    var c = document.querySelector('input[name="attente"]:checked');
    return c ? c.value : "";
  }

  function buildMessage() {
    var redactOn = $("redact").checked;
    var clean = function (t) { return redactOn ? redact(t) : t; };
    var cv = clean(cvText.value.trim());

    var wanted = Array.prototype.slice.call(document.querySelectorAll("#deliverables input:checked"))
      .map(function (c) { return "- " + c.value; });
    if (val("other")) wanted.push("- " + val("other"));

    var parts = ["Bonjour. J'utilise l'Analyse Le Bon Angle pour clarifier ma trajectoire et repositionner mes supports professionnels."];
    parts.push("## Ce que j'attends de l'analyse\n" + (attente() || "Y voir plus clair sur ma direction et améliorer mes supports."));
    parts.push("## Ce que je souhaite recevoir\n" + (wanted.length ? wanted.join("\n") : "- Vos recommandations les plus utiles pour clarifier mon rôle cible et améliorer mon CV et mon profil LinkedIn"));

    var situation = selectedText("situation");
    var situationDetail = clean(val("situation-detail"));
    if (situation || situationDetail) parts.push("## Ma situation actuelle\n" + [situation, situationDetail].filter(Boolean).join("\n"));

    parts.push("## Trajectoire envisagée\n" + (selectedText("trajectoire") || "Je ne sais pas encore."));
    if (val("role")) parts.push("## Rôle visé\n" + clean(val("role")));
    if (val("roles")) parts.push("## Rôles ou intitulés que j'envisage\n" + clean(val("roles")));
    if (val("change")) parts.push("## Ce que je veux changer\n" + clean(val("change")));
    var mode = selectedText("mode-travail");
    if (mode || val("zone")) parts.push("## Mode de travail et zone géographique\n" + [mode ? "Mode de travail souhaité : " + mode : "", val("zone") ? "Zone géographique : " + clean(val("zone")) : ""].filter(Boolean).join("\n"));
    if (val("langues")) parts.push("## Langues parlées\n" + clean(val("langues")));

    var supports = [];
    if (val("linkedin")) supports.push("### Mon profil LinkedIn actuel (titre et « À propos »)\n" + clean(val("linkedin")));
    if (val("autres-supports")) supports.push("### Autres supports\n" + clean(val("autres-supports")));
    if (supports.length) parts.push("## Mes supports actuels\n" + supports.join("\n\n"));

    parts.push("## Mon CV actuel\n" + cv);
    parts.push("Merci de répondre en français, en Markdown. Commence par une section « ## Synthèse » de quelques lignes sur ta lecture de mon parcours, puis une section de niveau 2 (##) par élément demandé, et termine par les priorités d'amélioration dans l'ordre.");
    return parts.join("\n\n");
  }

  /* ---------- 3. Appels au relais ---------- */
  function api(path, options) {
    return fetch(API + path, options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) {
          var err = new Error(data.error || "Le service est momentanément indisponible. Réessayez dans quelques minutes.");
          err.status = r.status;
          err.path = path;
          throw err;
        }
        return data;
      });
    }, function () {
      throw new Error("Connexion impossible au service d'analyse. Vérifiez votre connexion Internet, puis réessayez.");
    });
  }

  function poll(cId, attempt) {
    return new Promise(function (resolve) { setTimeout(resolve, POLL_MS); }).then(function () {
      return api("/result?c=" + encodeURIComponent(cId));
    }).then(function (data) {
      if (data.status === "done") return data.content || "";
      if (data.status === "error") throw new Error(data.error || "L'analyse n'a pas abouti. Contactez Le Bon Angle : l'analyse sera recréditée.");
      if (attempt >= POLL_MAX) throw new Error("L'analyse prend plus de temps que prévu. Gardez votre code et contactez Le Bon Angle si le problème persiste.");
      if (attempt === 15) $("progress-text").textContent = "Toujours en cours : l'agent rédige vos propositions…";
      return poll(cId, attempt + 1);
    });
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    $("progress").hidden = !busy;
    form.hidden = busy;
    if (busy) {
      $("progress-text").textContent = "Analyse en cours…";
      $("progress").focus();
    }
  }

  function showError(msg, focusEl) {
    errorBox.textContent = msg;
    errorBox.hidden = !msg;
    if (msg && focusEl) {
      focusEl.setAttribute("aria-invalid", "true");
      focusEl.focus();
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    showError("");
    $("service-full").hidden = true;
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (el) { el.removeAttribute("aria-invalid"); });

    var n = cvText.value.trim().length;
    if (n < 200) return showError("Ajoutez votre CV : déposez un fichier ou collez son texte (200 caractères minimum).", cvText);
    if (n > MAX_CHARS) return showError("Le CV est trop long : " + MAX_CHARS.toLocaleString("fr-FR") + " caractères maximum. Retirez les parties les moins utiles.", cvText);
    if (CODE_REQUIS && !val("access")) return showError("Saisissez votre code d'analyse (reçu par e-mail après l'achat).", $("access"));
    if (!$("consent").checked) return showError("Cochez la case d'accord pour lancer l'analyse.", $("consent"));

    var message = buildMessage();
    if (message.length > MAX_CHARS) return showError("L'ensemble de vos réponses et du CV dépasse " + MAX_CHARS.toLocaleString("fr-FR") + " caractères. Raccourcissez le CV ou les champs facultatifs.", cvText);

    lastRequest = {
      role: val("role") || "Non précisé",
      trajectoire: selectedText("trajectoire") || "Pas encore décidée",
      attente: attente() || "Non précisée"
    };

    setBusy(true);
    api("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, accessCode: val("access") })
    }).then(function (data) {
      var rem = $("remaining");
      if (typeof data.remaining === "number") {
        rem.textContent = data.remaining > 0
          ? "Il vous reste " + data.remaining + " analyse" + (data.remaining > 1 ? "s" : "") + " avec ce code."
          : "C'était l'analyse incluse avec ce code.";
        rem.hidden = false;
      } else {
        rem.hidden = true;
      }
      return poll(data.conversationId, 1);
    }).then(function (markdown) {
      showResult(markdown);
    }).catch(function (err) {
      setBusy(false);
      /* L'agent n'a pas pu être contacté (ex. limite de crédits atteinte) :
         le relais n'a pas consommé le code. Message dédié, rassurant. */
      if (err && err.status === 502 && err.path === "/analyze") {
        var full = $("service-full");
        full.hidden = false;
        full.scrollIntoView({ block: "center" });
        full.focus({ preventScroll: true });
        return;
      }
      showError(err.message || "Une erreur est survenue.");
      errorBox.scrollIntoView({ block: "center" });
    });
  }

  /* ---------- 4. Résultat ---------- */
  /* Découpe le résultat en blocs, un par titre principal */
  function splitIntoParts(container) {
    var nodes = Array.prototype.slice.call(container.childNodes);
    var level = 0;
    ["H1", "H2", "H3"].some(function (tag, i) {
      if (nodes.some(function (n) { return n.nodeName === tag; })) { level = i + 1; return true; }
      return false;
    });
    var tag = level ? "H" + level : null;
    var parts = [], current = null, toc = [];
    nodes.forEach(function (n) {
      if (n.nodeType === 3 && !n.textContent.trim()) return;
      if (!current || (tag && n.nodeName === tag)) {
        current = document.createElement("section");
        current.className = "result-part";
        current.id = "proposition-" + (parts.length + 1);
        parts.push(current);
        if (tag && n.nodeName === tag) toc.push({ id: current.id, text: n.textContent.trim() });
      }
      current.appendChild(n);
    });
    container.innerHTML = "";
    parts.forEach(function (p) { container.appendChild(p); });
    return toc;
  }

  function showResult(markdown) {
    lastMarkdown = markdown;
    var html = window.marked ? window.marked.parse(markdown) : "";
    var safe = html && window.DOMPurify ? window.DOMPurify.sanitize(html) : "";
    var body = $("result-body");
    if (safe) {
      body.innerHTML = safe;
    } else {
      var pre = document.createElement("pre");
      pre.textContent = markdown;
      body.innerHTML = "";
      body.appendChild(pre);
    }
    Array.prototype.forEach.call(body.querySelectorAll("a"), function (a) { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    var toc = splitIntoParts(body);

    $("sum-role").textContent = lastRequest.role;
    $("sum-traj").textContent = lastRequest.trajectoire;
    $("sum-attente").textContent = lastRequest.attente;
    var list = $("toc");
    list.innerHTML = "";
    toc.forEach(function (t) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + t.id;
      a.className = "text-link";
      a.textContent = t.text;
      li.appendChild(a);
      list.appendChild(li);
    });
    $("toc-wrap").hidden = !toc.length;

    $("progress").hidden = true;
    $("atelier-app").hidden = true;
    var section = $("result");
    section.hidden = false;
    section.focus();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyResult() {
    var status = $("copy-status");
    if (!navigator.clipboard) { status.textContent = "Copie automatique indisponible : sélectionnez le texte manuellement."; return; }
    navigator.clipboard.writeText(lastMarkdown).then(function () {
      status.textContent = "Texte copié dans le presse-papiers.";
    }, function () {
      status.textContent = "Copie impossible : sélectionnez le texte manuellement.";
    });
  }

  function downloadResult() {
    var blob = new Blob([lastMarkdown], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "analyse-le-bon-angle.md";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    $("copy-status").textContent = "Fichier téléchargé (format Markdown, lisible dans n'importe quel éditeur de texte).";
  }

  /* PDF : mise en page dédiée (voir @media print dans style.css).
     Le titre de la page sert de nom de fichier proposé par le navigateur. */
  function printResult() {
    var d = new Date();
    $("print-date").textContent = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    var previous = document.title;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    document.title = "Analyse Le Bon Angle " + pad(d.getDate()) + "-" + pad(d.getMonth() + 1) + "-" + d.getFullYear();
    var restore = function () { document.title = previous; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    $("copy-status").textContent = "Dans la fenêtre qui s'ouvre, choisissez « Enregistrer au format PDF » comme destination.";
    setTimeout(function () { window.print(); }, 50);
  }

  function restart() {
    $("result").hidden = true;
    $("result-body").innerHTML = "";
    $("copy-status").textContent = "";
    lastMarkdown = "";
    $("access").value = "";
    $("atelier-app").hidden = false;
    setBusy(false);
    $("atelier-app").scrollIntoView({ behavior: "smooth" });
    $("access").focus({ preventScroll: true });
  }

  /* ---------- Initialisation ---------- */
  function init() {
    if (!$("atelier-form")) return;
    if (!API) {
      $("atelier-app").hidden = true;
      $("atelier-closed").hidden = false;
      return;
    }

    form = $("atelier-form");
    fileInput = $("cv-file");
    cvText = $("cv-text");
    fileStatus = $("file-status");
    cvCount = $("cv-count");
    errorBox = $("form-error");
    submitBtn = $("submit-btn");
    errorBox.hidden = true;

    if (!CODE_REQUIS) $("access-wrap").hidden = true;

    var analyse = (CONFIG.OFFRES || {}).analyse || {};
    var buyUrl = String(analyse.lienPaiement || CONFIG.ATELIER_ACHAT_URL || "").trim();
    if (CODE_REQUIS && /^https:\/\//.test(buyUrl)) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-paiement-analyse]"), function (a) {
        a.href = buyUrl;
        a.target = "_blank";
        a.rel = "noopener";
      });
      $("buy-box").hidden = false;
    }

    fileInput.addEventListener("change", function () { handleFile(fileInput.files[0]); });
    cvText.addEventListener("input", updateCount);

    var dz = $("dropzone");
    ["dragenter", "dragover"].forEach(function (t) {
      dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (t) {
      dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove("is-over"); });
    });
    dz.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });

    form.addEventListener("submit", onSubmit);
    $("copy-btn").addEventListener("click", copyResult);
    $("download-btn").addEventListener("click", downloadResult);
    $("print-btn").addEventListener("click", printResult);
    $("restart-btn").addEventListener("click", restart);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
