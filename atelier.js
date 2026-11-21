/* =====================================================================
   LE BON ANGLE — L'Atelier
   1. Lecture du CV dans le navigateur (PDF, DOCX, TXT)
   2. Envoi au relais (Cloudflare Worker) qui transmet à l'agent Dust
   3. Attente puis affichage de la réponse (Markdown nettoyé)
   Rien n'est stocké par ce site.
   ===================================================================== */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var API = (CONFIG.ATELIER_API_URL || "").trim().replace(/\/$/, "");
  var MAX_CHARS = 40000;
  var POLL_MS = 4000;
  var POLL_MAX = 75; // ≈ 5 minutes

  var $ = function (id) { return document.getElementById(id); };
  var form, fileInput, cvText, fileStatus, cvCount, errorBox, submitBtn;
  var lastMarkdown = "";

  /* ---------- 1. Lecture du fichier ---------- */
  function readPdf(file) {
    var pdfjs = window.pdfjsLib;
    if (!pdfjs) return Promise.reject(new Error("Lecteur PDF indisponible."));
    pdfjs.GlobalWorkerOptions.workerSrc = "assets/vendor/pdf.worker.min.js";
    return file.arrayBuffer().then(function (buf) {
      return pdfjs.getDocument({ data: buf }).promise;
    }).then(function (pdf) {
      var pages = [];
      for (var i = 1; i <= pdf.numPages; i++) pages.push(i);
      return Promise.all(pages.map(function (n) {
        return pdf.getPage(n).then(function (p) { return p.getTextContent(); }).then(function (tc) {
          // Reconstitue les lignes à partir des positions verticales
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
    if (!window.mammoth) return Promise.reject(new Error("Lecteur Word indisponible."));
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
    if (name.endsWith(".doc")) return Promise.reject(new Error("Format .doc non pris en charge : enregistrez le CV en .docx ou en PDF."));
    return Promise.reject(new Error("Format non pris en charge. Utilisez un PDF, un .docx ou un fichier texte."));
  }

  function handleFile(file) {
    if (!file) return;
    fileStatus.textContent = "Lecture de « " + file.name + " »…";
    readFile(file).then(function (text) {
      text = (text || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (text.length < 200) {
        fileStatus.textContent = "Peu de texte trouvé dans ce fichier. S'il s'agit d'un CV scanné ou en image, copiez-collez son texte ci-dessous.";
      } else {
        fileStatus.textContent = "« " + file.name + " » lu. Vérifiez le texte ci-dessous avant l'envoi.";
      }
      cvText.value = text;
      updateCount();
    }).catch(function (e) {
      fileStatus.textContent = e.message || "Impossible de lire ce fichier.";
    });
  }

  function updateCount() {
    var n = cvText.value.trim().length;
    cvCount.textContent = n ? n.toLocaleString("fr-FR") + " caractères" + (n > MAX_CHARS ? " — trop long, 40 000 maximum" : "") : "";
  }

  /* ---------- 2. Construction du message ---------- */
  function redact(text) {
    return text
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail masqué]")
      .replace(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g, "[téléphone masqué]")
      .replace(/\+\d{1,3}[\s.-]?\d(?:[\s.-]?\d){6,12}/g, "[téléphone masqué]");
  }

  function buildMessage() {
    var cv = cvText.value.trim();
    if ($("redact").checked) cv = redact(cv);

    var wanted = Array.prototype.slice.call(document.querySelectorAll("#deliverables input:checked"))
      .map(function (c) { return "- " + c.value; });
    var other = $("other").value.trim();
    if (other) wanted.push("- " + other);

    var parts = ["Bonjour. J'utilise la Refonte carrière Le Bon Angle pour repenser mes supports professionnels."];
    parts.push("## Ce que je souhaite recevoir\n" + (wanted.length ? wanted.join("\n") : "- Vos recommandations les plus utiles pour mon CV et mon profil LinkedIn"));
    var traj = $("trajectoire").value;
    parts.push("## Trajectoire envisagée\n" + (traj || "Je ne sais pas encore."));
    if ($("role").value.trim()) parts.push("## Rôle visé\n" + $("role").value.trim());
    if ($("change").value.trim()) parts.push("## Ce que je veux changer\n" + $("change").value.trim());
    if ($("linkedin").value.trim()) parts.push("## Mon profil LinkedIn actuel\n" + $("linkedin").value.trim());
    parts.push("## Mon CV actuel\n" + cv);
    parts.push("Merci de répondre en français, en Markdown, avec une section par élément demandé.");
    return parts.join("\n\n");
  }

  /* ---------- 3. Appels au relais ---------- */
  function api(path, options) {
    return fetch(API + path, options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || "Le service est momentanément indisponible.");
        return data;
      });
    });
  }

  function poll(cId, attempt) {
    return new Promise(function (resolve) { setTimeout(resolve, POLL_MS); }).then(function () {
      return api("/result?c=" + encodeURIComponent(cId));
    }).then(function (data) {
      if (data.status === "done") return data.content || "";
      if (data.status === "error") throw new Error(data.error || "L'analyse n'a pas abouti.");
      if (attempt >= POLL_MAX) throw new Error("L'analyse prend plus de temps que prévu. Réessayez dans quelques minutes.");
      if (attempt === 15) $("progress-text").textContent = "Toujours en cours, l'agent rédige vos propositions…";
      return poll(cId, attempt + 1);
    });
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    $("progress").hidden = !busy;
    form.hidden = busy;
    if (busy) $("progress-text").textContent = "Analyse en cours…";
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = !msg;
  }

  function onSubmit(e) {
    e.preventDefault();
    showError("");
    var n = cvText.value.trim().length;
    if (n < 200) { showError("Ajoutez votre CV (fichier ou texte collé)."); cvText.focus(); return; }
    if (n > MAX_CHARS) { showError("Le CV est trop long : 40 000 caractères maximum."); cvText.focus(); return; }
    if (!$("access-wrap").hidden && !$("access").value.trim()) { showError("Saisissez votre code d'accès."); $("access").focus(); return; }
    if (!$("consent").checked) { showError("Merci de cocher la case d'accord pour lancer l'analyse."); $("consent").focus(); return; }

    setBusy(true);
    api("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: buildMessage(), accessCode: $("access").value.trim() })
    }).then(function (data) {
      var rem = $("remaining");
      if (typeof data.remaining === "number") {
        rem.textContent = data.remaining > 0
          ? "Il vous reste " + data.remaining + " analyse" + (data.remaining > 1 ? "s" : "") + " avec ce code."
          : "C'était la dernière analyse incluse avec ce code.";
        rem.hidden = false;
      } else {
        rem.hidden = true;
      }
      return poll(data.conversationId, 1);
    }).then(function (markdown) {
      showResult(markdown);
    }).catch(function (err) {
      setBusy(false);
      showError(err.message || "Une erreur est survenue.");
      errorBox.scrollIntoView({ block: "center" });
    });
  }

  /* ---------- 4. Résultat ---------- */
  function showResult(markdown) {
    lastMarkdown = markdown;
    var html = window.marked ? window.marked.parse(markdown) : "<pre></pre>";
    var safe = window.DOMPurify ? window.DOMPurify.sanitize(html) : "";
    var body = $("result-body");
    if (safe) body.innerHTML = safe; else body.textContent = markdown;
    body.querySelectorAll("a").forEach(function (a) { a.target = "_blank"; a.rel = "noopener noreferrer"; });

    $("progress").hidden = true;
    $("atelier-app").hidden = true;
    var section = $("result");
    section.hidden = false;
    section.focus();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyResult() {
    var done = function () { $("copy-status").textContent = "Texte copié."; };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lastMarkdown).then(done, function () { $("copy-status").textContent = "Copie impossible : sélectionnez le texte manuellement."; });
    }
  }

  function downloadResult() {
    var blob = new Blob([lastMarkdown], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "le-bon-angle-propositions.md";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function restart() {
    $("result").hidden = true;
    $("result-body").innerHTML = "";
    $("copy-status").textContent = "";
    lastMarkdown = "";
    $("atelier-app").hidden = false;
    setBusy(false);
    $("atelier-app").scrollIntoView({ behavior: "smooth" });
    cvText.focus({ preventScroll: true });
  }

  /* ---------- Initialisation ---------- */
  function init() {
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

    if (CONFIG.ATELIER_ACCESS_CODE_REQUIRED) $("access-wrap").hidden = false;

    var buyUrl = (CONFIG.ATELIER_ACHAT_URL || "").trim();
    if (/^https:\/\//.test(buyUrl)) {
      $("buy-link").href = buyUrl;
      $("buy-price").textContent = (CONFIG.ATELIER_PRIX_TEXTE || "").trim();
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
    $("restart-btn").addEventListener("click", restart);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
