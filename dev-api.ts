import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
  });
}

function json(res: import("http").ServerResponse, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export function devApiPlugin(): Plugin {
  return {
    name: "dev-api",
    configureServer(server: ViteDevServer) {
      const env = loadEnv("development", process.cwd(), "");
      const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

      if (!DATABASE_URL) {
        console.warn("\n  ⚠  DATABASE_URL not set — API routes disabled.\n     Create a .env file with DATABASE_URL=<your neon connection string>\n");
        return;
      }

      let sql: ReturnType<typeof import("@neondatabase/serverless").neon> | null = null;

      async function getSql() {
        if (!sql) {
          const { neon } = await import("@neondatabase/serverless");
          sql = neon(DATABASE_URL!);
        }
        return sql;
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") return json(res, {});

        try {
          const db = await getSql();

          // ---------- /api/leads/stats ----------
          if (pathname === "/api/leads/stats" && req.method === "GET") {
            const [totalRow] = await db`SELECT COUNT(*) as total FROM leads`;
            const segmentRows = await db`SELECT segment, COUNT(*) as count FROM leads GROUP BY segment ORDER BY segment`;
            const stageRows = await db`SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY stage`;
            const openProfileRow = await db`SELECT COUNT(*) as count FROM leads WHERE is_open_profile = true`;

            return json(res, {
              total: parseInt(totalRow.total),
              bySegment: segmentRows.map((r: Record<string, string>) => ({ segment: r.segment, count: parseInt(r.count) })),
              byStage: stageRows.map((r: Record<string, string>) => ({ stage: r.stage, count: parseInt(r.count) })),
              openProfiles: parseInt(openProfileRow[0].count),
            });
          }

          // ---------- PATCH /api/leads ----------
          if (pathname === "/api/leads" && req.method === "PATCH") {
            const body = JSON.parse(await readBody(req));
            const { linkedinUrl, fitScore, fitAnalysis } = body;

            if (!linkedinUrl) {
              return json(res, { error: "linkedinUrl is required" }, 400);
            }
            if (fitScore === undefined && fitAnalysis === undefined) {
              return json(res, { error: "At least one of fitScore or fitAnalysis is required" }, 400);
            }

            let result;
            if (fitScore !== undefined && fitAnalysis !== undefined) {
              result = await db`UPDATE leads SET fit_score = ${fitScore}, fit_analysis = ${fitAnalysis} WHERE linkedin_url = ${linkedinUrl} RETURNING id, first_name as "firstName", last_name as "lastName", linkedin_url as "linkedinUrl", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;
            } else if (fitScore !== undefined) {
              result = await db`UPDATE leads SET fit_score = ${fitScore} WHERE linkedin_url = ${linkedinUrl} RETURNING id, first_name as "firstName", last_name as "lastName", linkedin_url as "linkedinUrl", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;
            } else {
              result = await db`UPDATE leads SET fit_analysis = ${fitAnalysis} WHERE linkedin_url = ${linkedinUrl} RETURNING id, first_name as "firstName", last_name as "lastName", linkedin_url as "linkedinUrl", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;
            }

            if (result.length === 0) {
              return json(res, { error: "No lead found with that linkedinUrl" }, 404);
            }

            return json(res, { ok: true, updated: result[0] });
          }

          // ---------- GET /api/leads ----------
          if (pathname === "/api/leads" && req.method === "GET") {
            const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
            const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
            const offset = (page - 1) * limit;
            const search = url.searchParams.get("search") || "";
            const segment = url.searchParams.get("segment") || "";
            const stage = url.searchParams.get("stage") || "";

            let countQuery = "SELECT COUNT(*) as total FROM leads WHERE 1=1";
            let dataQuery = `SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt" FROM leads WHERE 1=1`;

            const conditions: string[] = [];
            const params: (string | number)[] = [];
            let paramIdx = 1;

            if (search) {
              conditions.push(
                `(first_name ILIKE $${paramIdx} OR last_name ILIKE $${paramIdx} OR headline ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR location ILIKE $${paramIdx})`
              );
              params.push(`%${search}%`);
              paramIdx++;
            }
            if (segment) {
              conditions.push(`segment = $${paramIdx}`);
              params.push(segment);
              paramIdx++;
            }
            if (stage) {
              conditions.push(`stage = $${paramIdx}`);
              params.push(stage);
              paramIdx++;
            }

            const whereClause = conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";

            const countResult = await db.query(countQuery + whereClause, params);
            const total = parseInt(countResult[0].total);

            const dataResult = await db.query(
              dataQuery + whereClause + ` ORDER BY id DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
              [...params, limit, offset]
            );

            return json(res, { data: dataResult, total, page, limit, totalPages: Math.ceil(total / limit) });
          }

          // ---------- GET /api/leads/feedback ----------
          if (pathname === "/api/leads/feedback" && req.method === "GET") {
            const leadId = parseInt(url.searchParams.get("leadId") || "");
            if (!leadId) return json(res, { error: "leadId is required" }, 400);

            const rows = await db`
              SELECT id, lead_id as "leadId", feedback, rating, created_at as "createdAt"
              FROM lead_feedback
              WHERE lead_id = ${leadId}
              ORDER BY created_at DESC
            `;
            return json(res, { data: rows });
          }

          // ---------- POST /api/leads/feedback ----------
          if (pathname === "/api/leads/feedback" && req.method === "POST") {
            const body = JSON.parse(await readBody(req));
            const { leadId, feedback, rating } = body;
            if (!leadId || !feedback) {
              return json(res, { error: "leadId and feedback are required" }, 400);
            }

            const rows = await db`
              INSERT INTO lead_feedback (lead_id, feedback, rating)
              VALUES (${leadId}, ${feedback}, ${rating || null})
              RETURNING id, lead_id as "leadId", feedback, rating, created_at as "createdAt"
            `;
            return json(res, { ok: true, data: rows[0] }, 201);
          }

          // ---------- GET /api/campaigns ----------
          if (pathname === "/api/campaigns" && req.method === "GET") {
            const rows = await db`
              SELECT c.id, c.name, c.description, c.status,
                     c.created_at as "createdAt", c.updated_at as "updatedAt",
                     COALESCE(cl.lead_count, 0)::int as "leadCount"
              FROM campaigns c
              LEFT JOIN (
                SELECT campaign_id, COUNT(*) as lead_count
                FROM campaign_leads
                GROUP BY campaign_id
              ) cl ON cl.campaign_id = c.id
              ORDER BY c.created_at DESC
            `;
            return json(res, { data: rows });
          }

          // ---------- POST /api/campaigns ----------
          if (pathname === "/api/campaigns" && req.method === "POST") {
            const body = JSON.parse(await readBody(req));
            const { name, description } = body;
            if (!name) return json(res, { error: "name is required" }, 400);

            const rows = await db`
              INSERT INTO campaigns (name, description)
              VALUES (${name}, ${description || null})
              RETURNING id, name, description, status, created_at as "createdAt", updated_at as "updatedAt"
            `;
            return json(res, { data: { ...rows[0], leadCount: 0 } }, 201);
          }

          // ---------- PATCH /api/campaigns ----------
          if (pathname === "/api/campaigns" && req.method === "PATCH") {
            const body = JSON.parse(await readBody(req));
            const { id, name, description, status } = body;
            if (!id) return json(res, { error: "id is required" }, 400);

            const sets: string[] = [];
            const params: (string | number)[] = [];
            let paramIdx = 1;

            if (name !== undefined) { sets.push(`name = $${paramIdx}`); params.push(name); paramIdx++; }
            if (description !== undefined) { sets.push(`description = $${paramIdx}`); params.push(description); paramIdx++; }
            if (status !== undefined) { sets.push(`status = $${paramIdx}`); params.push(status); paramIdx++; }
            sets.push("updated_at = NOW()");

            if (sets.length === 1) return json(res, { error: "No fields to update" }, 400);

            const query = `UPDATE campaigns SET ${sets.join(", ")} WHERE id = $${paramIdx} RETURNING id, name, description, status, created_at as "createdAt", updated_at as "updatedAt"`;
            params.push(id);

            const rows = await db.query(query, params);
            if (rows.length === 0) return json(res, { error: "Campaign not found" }, 404);
            return json(res, { data: rows[0] });
          }

          // ---------- DELETE /api/campaigns ----------
          if (pathname === "/api/campaigns" && req.method === "DELETE") {
            const body = JSON.parse(await readBody(req));
            const { id } = body;
            if (!id) return json(res, { error: "id is required" }, 400);
            await db`DELETE FROM campaigns WHERE id = ${id}`;
            return json(res, { ok: true });
          }

          // ---------- GET /api/campaigns/leads ----------
          if (pathname === "/api/campaigns/leads" && req.method === "GET") {
            const campaignId = parseInt(url.searchParams.get("campaignId") || "");
            if (!campaignId) return json(res, { error: "campaignId is required" }, 400);

            const rows = await db`
              SELECT l.id, l.first_name as "firstName", l.last_name as "lastName", l.headline, l.company, l.location,
                     l.sales_nav_url as "salesNavUrl", l.linkedin_url as "linkedinUrl", l.linkedin_id as "linkedinId",
                     l.is_open_profile as "isOpenProfile", l.segment, l.stage, l.created_at as "createdAt",
                     l.fit_score as "fitScore", l.fit_analysis as "fitAnalysis", cl.added_at as "addedAt"
              FROM campaign_leads cl
              JOIN leads l ON l.id = cl.lead_id
              WHERE cl.campaign_id = ${campaignId}
              ORDER BY cl.added_at DESC
            `;
            return json(res, { data: rows });
          }

          // ---------- POST /api/campaigns/leads ----------
          if (pathname === "/api/campaigns/leads" && req.method === "POST") {
            const body = JSON.parse(await readBody(req));
            const { campaignId, leadIds, filters } = body;
            if (!campaignId) return json(res, { error: "campaignId is required" }, 400);

            let resolvedLeadIds: number[] = leadIds || [];

            if (filters && !leadIds) {
              const conditions: string[] = [];
              const fParams: (string | number)[] = [];
              let fIdx = 1;

              if (filters.search) {
                conditions.push(`(first_name ILIKE $${fIdx} OR last_name ILIKE $${fIdx} OR headline ILIKE $${fIdx} OR company ILIKE $${fIdx} OR location ILIKE $${fIdx})`);
                fParams.push(`%${filters.search}%`);
                fIdx++;
              }
              if (filters.stage) { conditions.push(`stage = $${fIdx}`); fParams.push(filters.stage); fIdx++; }
              if (filters.segment) { conditions.push(`segment = $${fIdx}`); fParams.push(filters.segment); fIdx++; }
              if (filters.score === "yes") conditions.push(`fit_score >= 65`);
              else if (filters.score === "lean_yes") conditions.push(`fit_score >= 50 AND fit_score < 65`);
              else if (filters.score === "lean_no") conditions.push(`fit_score >= 35 AND fit_score < 50`);
              else if (filters.score === "no") conditions.push(`fit_score < 35`);
              else if (filters.score === "unscored") conditions.push(`fit_score IS NULL`);

              const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
              const rows = await db.query(`SELECT id FROM leads ${whereClause}`, fParams);
              resolvedLeadIds = rows.map((r: { id: number }) => r.id);
            }

            if (resolvedLeadIds.length === 0) return json(res, { error: "No lead IDs to add" }, 400);

            const values = resolvedLeadIds.map((_: number, i: number) => `($1, $${i + 2})`).join(", ");
            const query = `INSERT INTO campaign_leads (campaign_id, lead_id) VALUES ${values} ON CONFLICT (campaign_id, lead_id) DO NOTHING`;
            await db.query(query, [campaignId, ...resolvedLeadIds]);

            return json(res, { ok: true, added: resolvedLeadIds.length }, 201);
          }

          // ---------- DELETE /api/campaigns/leads ----------
          if (pathname === "/api/campaigns/leads" && req.method === "DELETE") {
            const body = JSON.parse(await readBody(req));
            const { campaignId, leadIds } = body;
            if (!campaignId || !leadIds?.length) return json(res, { error: "campaignId and leadIds required" }, 400);

            const placeholders = leadIds.map((_: number, i: number) => `$${i + 2}`).join(", ");
            const query = `DELETE FROM campaign_leads WHERE campaign_id = $1 AND lead_id IN (${placeholders})`;
            await db.query(query, [campaignId, ...leadIds]);

            return json(res, { ok: true });
          }

          // ---------- /api/candidates ----------
          if (pathname === "/api/candidates" && req.method === "GET") {
            const rows = await db`SELECT id, name, position, company, linkedin_url as "linkedinUrl", location, experience_years as "experienceYears", fit_score as "fitScore", date_added as "dateAdded", stage, account, target_position as "targetPosition" FROM candidates ORDER BY date_added DESC`;
            return json(res, rows);
          }

          if (pathname === "/api/candidates" && req.method === "POST") {
            const body = JSON.parse(await readBody(req));
            const id = "c" + Date.now();
            await db`INSERT INTO candidates (id, name, position, company, linkedin_url, location, experience_years, fit_score, date_added, stage, account, target_position) VALUES (${id}, ${body.name}, ${body.position}, ${body.company}, ${body.linkedinUrl}, ${body.location}, ${body.experienceYears}, ${body.fitScore}, ${body.dateAdded || new Date().toISOString().slice(0, 10)}, ${body.stage || "sourced"}, ${body.account}, ${body.targetPosition})`;
            return json(res, { id, ...body }, 201);
          }

          // ---------- /api/candidates/:id ----------
          const candidateMatch = pathname.match(/^\/api\/candidates\/(.+)$/);
          if (candidateMatch) {
            const id = candidateMatch[1];

            if (req.method === "PATCH") {
              const body = JSON.parse(await readBody(req));
              if (body.stage) {
                await db`UPDATE candidates SET stage = ${body.stage} WHERE id = ${id}`;
              }
              return json(res, { ok: true });
            }

            if (req.method === "DELETE") {
              await db`DELETE FROM candidates WHERE id = ${id}`;
              return json(res, { ok: true });
            }
          }

          return json(res, { error: "Not found" }, 404);
        } catch (err) {
          console.error("Dev API error:", err);
          return json(res, { error: "Internal server error" }, 500);
        }
      });
    },
  };
}
