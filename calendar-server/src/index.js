// Eduarte Tools - agenda-server (Cloudflare Worker + D1)
//
// POST   /api/feeds          -> nieuwe agenda-link: { id, token }
// PUT    /api/feeds/:id      -> week bijwerken (Authorization: Bearer <token>)
// DELETE /api/feeds/:id      -> agenda-link verwijderen (Authorization: Bearer <token>)
// GET    /cal/:id.ics        -> de agenda zelf, voor Outlook / Google / Apple

import { cleanWeek, mergeWeek, randomId, sha256, toIcs } from "./feed.js";

const ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;
const MAX_BODY = 200_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function authorized(env, id, request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const row = await env.DB.prepare("SELECT token_hash, events FROM feeds WHERE id = ?").bind(id).first();
  if (!row || row.token_hash !== await sha256(token)) return null;
  return row;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, PUT, DELETE",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
        },
      });
    }

    if (request.method === "POST" && path === "/api/feeds") {
      const id = randomId(24);
      const token = randomId(32);
      const now = Date.now();
      await env.DB.prepare("INSERT INTO feeds (id, token_hash, events, created_at, updated_at) VALUES (?, ?, '[]', ?, ?)")
        .bind(id, await sha256(token), now, now).run();
      return json({ id, token }, 201);
    }

    const apiMatch = /^\/api\/feeds\/([^/]+)$/.exec(path);
    if (apiMatch && ID_PATTERN.test(apiMatch[1])) {
      const id = apiMatch[1];
      const row = await authorized(env, id, request);
      if (!row) return json({ error: "Onbekende of ongeldige agenda-link." }, 403);

      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM feeds WHERE id = ?").bind(id).run();
        return json({ success: true });
      }

      if (request.method === "PUT") {
        const body = await request.text();
        if (body.length > MAX_BODY) return json({ error: "Te veel gegevens." }, 413);
        let week;
        try { week = cleanWeek(JSON.parse(body)); } catch { week = null; }
        if (!week) return json({ error: "Ongeldige week." }, 400);
        const events = mergeWeek(JSON.parse(row.events || "[]"), week);
        await env.DB.prepare("UPDATE feeds SET events = ?, updated_at = ? WHERE id = ?")
          .bind(JSON.stringify(events), Date.now(), id).run();
        return json({ success: true, lessons: week.lessons.length });
      }
    }

    const calMatch = /^\/cal\/([^/]+)\.ics$/.exec(path);
    if (request.method === "GET" && calMatch && ID_PATTERN.test(calMatch[1])) {
      const row = await env.DB.prepare("SELECT events, updated_at FROM feeds WHERE id = ?").bind(calMatch[1]).first();
      if (!row) return new Response("Agenda niet gevonden", { status: 404 });
      return new Response(toIcs(JSON.parse(row.events || "[]"), new Date(row.updated_at).toISOString()), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'inline; filename="eduarte-rooster.ics"',
          "Cache-Control": "public, max-age=900",
        },
      });
    }

    return new Response("Eduarte Tools agenda-server", { status: path === "/" ? 200 : 404 });
  },

  // Dagelijks: agenda-links die 4 maanden niet zijn bijgewerkt verwijderen
  async scheduled(event, env) {
    await env.DB.prepare("DELETE FROM feeds WHERE updated_at < ?").bind(Date.now() - 120 * 86400000).run();
  },
};
