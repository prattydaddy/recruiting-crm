import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

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

  try {
    // Build dynamic query using tagged template approach
    let countResult;
    let dataResult;

    if (search && segment && stage) {
      const s = `%${search}%`;
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) AND segment = ${segment} AND stage = ${stage}`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) AND segment = ${segment} AND stage = ${stage} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (search && segment) {
      const s = `%${search}%`;
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) AND segment = ${segment}`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) AND segment = ${segment} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (search && stage) {
      const s = `%${search}%`;
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) AND stage = ${stage}`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) AND stage = ${stage} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (segment && stage) {
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE segment = ${segment} AND stage = ${stage}`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE segment = ${segment} AND stage = ${stage} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (search) {
      const s = `%${search}%`;
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s})`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR headline ILIKE ${s} OR company ILIKE ${s} OR location ILIKE ${s}) ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (segment) {
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE segment = ${segment}`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE segment = ${segment} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (stage) {
      countResult = await sql`SELECT COUNT(*) as total FROM leads WHERE stage = ${stage}`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads WHERE stage = ${stage} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql`SELECT COUNT(*) as total FROM leads`;
      dataResult = await sql`SELECT id, first_name as "firstName", last_name as "lastName", headline, company, location, sales_nav_url as "salesNavUrl", linkedin_url as "linkedinUrl", linkedin_id as "linkedinId", is_open_profile as "isOpenProfile", segment, stage, created_at as "createdAt", fit_score as "fitScore", fit_analysis as "fitAnalysis" FROM leads ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    }

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