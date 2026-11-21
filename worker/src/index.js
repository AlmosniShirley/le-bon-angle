/* =====================================================================
   LE BON ANGLE — Relais Atelier ⇄ agent Dust (Cloudflare Worker)
   ---------------------------------------------------------------------
   Rôle : garder la clé API Dust secrète. Le site n'appelle jamais Dust
   directement ; il passe par ce relais.

   Routes :
     POST /analyze          → crée une conversation avec l'agent
                              body JSON : { message, accessCode? }
                              réponse   : { conversationId }
     GET  /result?c=<id>    → état de la réponse de l'agent
                              réponse   : { status: "running" | "done" | "error", content? }

   Secrets (wrangler secret put …) :
     DUST_API_KEY   clé API Dust (obligatoire)
     ACCESS_CODE    code d'accès à donner aux candidats (optionnel mais conseillé)

   Variables (wrangler.toml) :
     DUST_BASE_URL     https://dust.tt  ou  https://eu.dust.tt
     DUST_WORKSPACE_ID identifiant de l'espace Dust (visible dans l'URL : /w/<ID>/…)
     DUST_AGENT_ID     identifiant de l'agent (hgYs4LZhi2)
     ALLOWED_ORIGINS   origines autorisées, séparées par des virgules

   Aucun CV n'est stocké par ce relais.
   ===================================================================== */

const MAX_MESSAGE_CHARS = 40000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const originOk = allowed.includes(origin);

    const cors = {
      "Access-Control-Allow-Origin": originOk ? origin : "null",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });

    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (!originOk) return json({ error: "Origine non autorisée." }, 403);
    if (!env.DUST_API_KEY || !env.DUST_WORKSPACE_ID || !env.DUST_AGENT_ID) {
      return json({ error: "Le relais n'est pas encore configuré." }, 500);
    }

    const url = new URL(request.url);
    const base = (env.DUST_BASE_URL || "https://dust.tt").replace(/\/$/, "");
    const api = `${base}/api/v1/w/${encodeURIComponent(env.DUST_WORKSPACE_ID)}/assistant/conversations`;
    const auth = { Authorization: `Bearer ${env.DUST_API_KEY}`, "Content-Type": "application/json" };

    try {
      /* ---------- Envoi du CV à l'agent ---------- */
      if (request.method === "POST" && url.pathname === "/analyze") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Requête invalide." }, 400); }

        if (env.ACCESS_CODE && (body.accessCode || "").trim() !== env.ACCESS_CODE) {
          return json({ error: "Code d'accès incorrect." }, 401);
        }
        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (message.length < 200) return json({ error: "Le contenu du CV semble vide ou trop court." }, 400);
        if (message.length > MAX_MESSAGE_CHARS) return json({ error: "Le CV est trop long (40 000 caractères maximum)." }, 413);

        const res = await fetch(api, {
          method: "POST",
          headers: auth,
          body: JSON.stringify({
            title: "Atelier Le Bon Angle",
            visibility: "unlisted",
            blocking: false,
            message: {
              content: message,
              mentions: [{ configurationId: env.DUST_AGENT_ID }],
              context: { username: "atelier-le-bon-angle", timezone: "Europe/Paris" },
            },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.conversation) {
          console.log("Dust create error", res.status, JSON.stringify(data).slice(0, 500));
          return json({ error: "L'agent n'a pas pu être contacté." }, 502);
        }
        return json({ conversationId: data.conversation.sId });
      }

      /* ---------- Lecture de la réponse ---------- */
      if (request.method === "GET" && url.pathname === "/result") {
        const cId = url.searchParams.get("c") || "";
        if (!/^[A-Za-z0-9_-]{6,64}$/.test(cId)) return json({ error: "Identifiant invalide." }, 400);

        const res = await fetch(`${api}/${cId}`, { headers: auth });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.conversation) return json({ status: "error", error: "Conversation introuvable." }, 502);

        // conversation.content = liste de messages, chacun sous forme de liste de versions
        const messages = (data.conversation.content || []).map((versions) => versions[versions.length - 1]);
        const reply = messages.filter((m) => m && m.type === "agent_message").pop();

        if (!reply || reply.status === "created") return json({ status: "running" });
        if (reply.status === "succeeded") return json({ status: "done", content: reply.content || "" });
        return json({ status: "error", error: "L'agent n'a pas pu terminer l'analyse." });
      }

      return json({ error: "Route inconnue." }, 404);
    } catch (e) {
      console.log("Relay error", String(e));
      return json({ error: "Erreur du relais." }, 500);
    }
  },
};
