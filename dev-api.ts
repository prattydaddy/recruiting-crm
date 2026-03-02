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

          // ---------- /api/leads ----------
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
