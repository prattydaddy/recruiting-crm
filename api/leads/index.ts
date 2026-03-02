import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || "";
  const segment = (req.query.segment as string) || "";
  const stage = (req.query.stage as string) || "";

  try {
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

    const countResult = await sql.query(countQuery + whereClause, params);
    const total = parseInt(countResult[0].total);

    const dataResult = await sql.query(
      dataQuery + whereClause + ` ORDER BY id DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return res.json({
      data: dataResult,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Leads API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
