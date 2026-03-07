import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET /api/campaigns/leads?campaignId=123 ----------
    if (req.method === "GET") {
      const campaignId = parseInt(req.query.campaignId as string);
      if (!campaignId) return res.status(400).json({ error: "campaignId is required" });

      const query = `
        SELECT l.id, l.first_name as "firstName", l.last_name as "lastName", l.headline, l.company, l.location,
               l.sales_nav_url as "salesNavUrl", l.linkedin_url as "linkedinUrl", l.linkedin_id as "linkedinId",
               l.is_open_profile as "isOpenProfile", l.segment, l.stage, l.created_at as "createdAt",
               l.fit_score as "fitScore", l.fit_analysis as "fitAnalysis", cl.added_at as "addedAt"
        FROM campaign_leads cl
        JOIN leads l ON l.id = cl.lead_id
        WHERE cl.campaign_id = $1
        ORDER BY cl.added_at DESC
      `;
      const rows = await sql.query(query, [campaignId]);
      return res.json({ data: rows });
    }

    // ---------- POST /api/campaigns/leads ----------
    if (req.method === "POST") {
      const { campaignId, leadIds, filters } = req.body || {};
      if (!campaignId) return res.status(400).json({ error: "campaignId is required" });

      let resolvedLeadIds: number[] = leadIds || [];

      // If filters provided (select all matching), resolve lead IDs server-side
      if (filters && !leadIds) {
        const conditions: string[] = [];
        const params: (string | number)[] = [];
        let paramIdx = 1;

        if (filters.search) {
          const s = `%${filters.search}%`;
          conditions.push(`(first_name ILIKE $${paramIdx} OR last_name ILIKE $${paramIdx} OR headline ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR location ILIKE $${paramIdx})`);
          params.push(s);
          paramIdx++;
        }
        if (filters.stage) {
          conditions.push(`stage = $${paramIdx}`);
          params.push(filters.stage);
          paramIdx++;
        }
        if (filters.segment) {
          conditions.push(`segment = $${paramIdx}`);
          params.push(filters.segment);
          paramIdx++;
        }
        if (filters.score) {
          if (filters.score === "yes") conditions.push(`fit_score >= 65`);
          else if (filters.score === "lean_yes") conditions.push(`fit_score >= 50 AND fit_score < 65`);
          else if (filters.score === "lean_no") conditions.push(`fit_score >= 35 AND fit_score < 50`);
          else if (filters.score === "no") conditions.push(`fit_score < 35`);
          else if (filters.score === "unscored") conditions.push(`fit_score IS NULL`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const query = `SELECT id FROM leads ${whereClause}`;
        const rows = await sql.query(query, params);
        resolvedLeadIds = rows.map((r: { id: number }) => r.id);
      }

      if (resolvedLeadIds.length === 0) {
        return res.status(400).json({ error: "No lead IDs to add" });
      }

      // Insert leads (ignore duplicates)
      const values = resolvedLeadIds.map((_, i) => `($1, $${i + 2})`).join(", ");
      const query = `INSERT INTO campaign_leads (campaign_id, lead_id) VALUES ${values} ON CONFLICT (campaign_id, lead_id) DO NOTHING`;
      await sql.query(query, [campaignId, ...resolvedLeadIds]);

      return res.status(201).json({ ok: true, added: resolvedLeadIds.length });
    }

    // ---------- DELETE /api/campaigns/leads ----------
    if (req.method === "DELETE") {
      const { campaignId, leadIds } = req.body || {};
      if (!campaignId || !leadIds?.length) {
        return res.status(400).json({ error: "campaignId and leadIds are required" });
      }

      const placeholders = leadIds.map((_: number, i: number) => `$${i + 2}`).join(", ");
      const query = `DELETE FROM campaign_leads WHERE campaign_id = $1 AND lead_id IN (${placeholders})`;
      await sql.query(query, [campaignId, ...leadIds]);

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Campaign leads API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
