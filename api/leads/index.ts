import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

const COLUMNS = `id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ---------- PATCH /api/leads ----------
  if (req.method === "PATCH") {
    try {
      const { linkedinUrl, fitScore, fitAnalysis } = req.body || {};

      if (!linkedinUrl) {
        return res.status(400).json({ error: "linkedinUrl is required" });
      }
      if (fitScore === undefined && fitAnalysis === undefined) {
        return res.status(400).json({ error: "At least one of fitScore or fitAnalysis is required" });
      }

      let result;
      if (fitScore !== undefined && fitAnalysis !== undefined) {
        result = await sql`UPDATE leads SET fit_score = ${fitScore}, fit_analysis = ${fitAnalysis} WHERE linkedin_url = ${linkedinUrl} RETURNING id, first_name as "firstName", last_name as "lastName", linkedin_url as "linkedinUrl", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;
      } else if (fitScore !== undefined) {
        result = await sql`UPDATE leads SET fit_score = ${fitScore} WHERE linkedin_url = ${linkedinUrl} RETURNING id, first_name as "firstName", last_name as "lastName", linkedin_url as "linkedinUrl", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;
      } else {
        result = await sql`UPDATE leads SET fit_analysis = ${fitAnalysis} WHERE linkedin_url = ${linkedinUrl} RETURNING id, first_name as "firstName", last_name as "lastName", linkedin_url as "linkedinUrl", fit_score as "fitScore", fit_analysis as "fitAnalysis"`;
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "No lead found with that linkedinUrl" });
      }

      return res.json({ ok: true, updated: result[0] });
    } catch (err) {
      console.error("Leads PATCH error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || "";
  const segment = (req.query.segment as string) || "";
  const stage = (req.query.stage as string) || "";
  const scoreFilter = (req.query.score as string) || "";
  const sortBy = (req.query.sort as string) || "";

  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      const s = `%${search}%`;
      conditions.push(`(first_name ILIKE $${paramIdx} OR last_name ILIKE $${paramIdx} OR headline ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR location ILIKE $${paramIdx})`);
      params.push(s);
      paramIdx++;
    }
    if (stage) {
      conditions.push(`stage = $${paramIdx}`);
      params.push(stage);
      paramIdx++;
    }
    if (segment) {
      conditions.push(`segment = $${paramIdx}`);
      params.push(segment);
      paramIdx++;
    }

    // Score filter
    if (scoreFilter === "yes") conditions.push(`fit_score >= 65`);
    else if (scoreFilter === "lean_yes") conditions.push(`fit_score >= 50 AND fit_score < 65`);
    else if (scoreFilter === "lean_no") conditions.push(`fit_score >= 35 AND fit_score < 50`);
    else if (scoreFilter === "no") conditions.push(`fit_score < 35`);
    else if (scoreFilter === "unscored") conditions.push(`fit_score IS NULL`);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Sort
    let orderClause = "ORDER BY id DESC";
    if (sortBy === "score_desc") orderClause = "ORDER BY fit_score DESC NULLS LAST";
    else if (sortBy === "score_asc") orderClause = "ORDER BY fit_score ASC NULLS LAST";

    const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
    const dataQuery = `SELECT ${COLUMNS} FROM leads ${whereClause} ${orderClause} LIMIT ${limit} OFFSET ${offset}`;

    const [countResult, dataResult] = await Promise.all([
      sql(countQuery, params),
      sql(dataQuery, params),
    ]);

    const total = parseInt(countResult[0].total);

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
