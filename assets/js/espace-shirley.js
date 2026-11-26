/* =====================================================================
   LE BON ANGLE — Espace privé de Shirley : codes du questionnaire préparatoire
   Toutes les actions passent par le relais et exigent le code personnel
   (secret ACCESS_CODE). Le code n'est gardé que dans cet onglet.
   ===================================================================== */
(function () {
  "use strict";
  var API = String((window.QUESTIONNAIRE || {}).API_URL || "").replace(/\/$/, "");
  var $ = function (id) { return document.getElementById(id); };
  var admin = "";

  function api(path, body) {
    body.admin = admin;
    return fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d.error || "Service indisponible, réessayez.");
          return d;
        });
      }, function () { throw new Error("Connexion impossible."); });
  }
  function dateFr(s) { return s ? new Date(s).toLocaleDateString("fr-FR") : ""; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function copier(texte, statut) {
    (navigator.clipboard ? navigator.clipboard.writeText(texte) : Promise.reject()).then(function () {
      statut.textContent = "Copié !";
    }, function () { statut.textContent = "Sélectionnez le lien et copiez-le."; });
    setTimeout(function () { statut.textContent = ""; }, 2500);
  }

  function charger() {
    return api("/admin/list", {}).then(function (d) {
      var tb = $("liste"); tb.innerHTML = "";
      $("vide").hidden = d.codes.length > 0;
      d.codes.forEach(function (c) {
        var tr = document.createElement("tr");
        tr.appendChild(el("td", null, c.nom || "—"));
        var tdc = el("td"); tdc.appendChild(el("code", null, c.code)); tr.appendChild(tdc);
        tr.appendChild(el("td", "col-date", dateFr(c.cree)));
        var tde = el("td");
        tde.appendChild(el("span", "etat" + (c.utilise ? " fait" : ""), c.utilise ? "Envoyé le " + dateFr(c.utilise) : "En attente"));
        tr.appendChild(tde);
        var tda = el("td"); tda.style.whiteSpace = "nowrap";
        if (!c.utilise) {
          var b = el("button", "btn btn-secondary mini", "Copier le lien"); b.type = "button";
          var st = el("span"); st.setAttribute("role", "status"); st.style.marginLeft = ".4rem";
          b.addEventListener("click", function () { copier(c.lien, st); });
          tda.appendChild(b); tda.appendChild(st);
        }
        var s = el("button", "btn btn-secondary mini", "Supprimer"); s.type = "button"; s.style.marginLeft = ".4rem";
        s.addEventListener("click", function () {
          if (!confirm("Supprimer le code de " + (c.nom || c.code) + " ? Il ne fonctionnera plus.")) return;
          api("/admin/delete", { code: c.code }).then(charger).catch(function (e) { alert(e.message); });
        });
        tda.appendChild(s);
        tr.appendChild(tda);
        tb.appendChild(tr);
      });
    });
  }

  function entrer(code) {
    admin = code;
    $("login-btn").disabled = true;
    return charger().then(function () {
      try { sessionStorage.setItem("lba-admin", admin); } catch (e) {}
      $("login").hidden = true; $("espace").hidden = false; $("nom").focus();
    }).catch(function (e) {
      admin = "";
      try { sessionStorage.removeItem("lba-admin"); } catch (er) {}
      $("login-error").textContent = e.message;
    }).then(function () { $("login-btn").disabled = false; });
  }

  $("login").addEventListener("submit", function (ev) {
    ev.preventDefault();
    $("login-error").textContent = "";
    var c = $("admin").value.trim().toUpperCase();
    if (c) entrer(c);
  });

  $("creer").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nom = $("nom").value.trim();
    $("creer-error").textContent = "";
    if (!nom) { $("creer-error").textContent = "Indiquez le prénom et le nom."; return; }
    $("creer-btn").disabled = true;
    api("/admin/create", { nom: nom }).then(function (d) {
      $("r-nom").textContent = d.nom; $("r-code").textContent = d.code; $("r-lien").value = d.lien;
      $("resultat").hidden = false; $("nom").value = "";
      return charger();
    }).catch(function (e) { $("creer-error").textContent = e.message; })
      .then(function () { $("creer-btn").disabled = false; });
  });

  $("copier").addEventListener("click", function () { copier($("r-lien").value, $("copie-ok")); });
  $("r-lien").addEventListener("focus", function () { this.select(); });
  $("quitter").addEventListener("click", function () {
    try { sessionStorage.removeItem("lba-admin"); } catch (e) {}
    location.reload();
  });

  try { var s = sessionStorage.getItem("lba-admin"); if (s) entrer(s); } catch (e) {}
})();
