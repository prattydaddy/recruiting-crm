import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

const WEBHOOK_URL =
  "https://api.poshpixel.studio/webhook/91b54342-5a3c-4c95-9ed0-1fa2453bf10a";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Accept either explicit leadIds or filters (for select-all-matching)
  const { leadIds, filters } = req.body || {};

  try {
    let leads: { id: number; linkedin_url: string; sales_nav_url: string }[];

    if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
      leads = await sql`
        SELECT id, linkedin_url, sales_nav_url FROM leads
        WHERE id = ANY(${leadIds})
      `;
    } else if (filters) {
      // Build dynamic query for all matching leads
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (filters.search) {
        conditions.push(`(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR headline ILIKE $${idx})`);
        params.push(`%${filters.search}%`);
        idx++;
      }
      if (filters.stage) {
        conditions.push(`stage = $${idx}`);
        params.push(filters.stage);
        idx++;
      }
      if (filters.score) {
        const scoreMap: Record<string, string> = {
          yes: "fit_score >= 65",
          lean_yes: "fit_score >= 50 AND fit_score < 65",
          lean_no: "fit_score >= 35 AND fit_score < 50",
          no: "fit_score < 35",
          unscored: "fit_score IS NULL",
        };
        if (scoreMap[filters.score]) conditions.push(scoreMap[filters.score]);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const result = await sql.query(
        `SELECT id, linkedin_url, sales_nav_url FROM leads ${where}`,
        params
      );
      leads = result.rows || result;
    } else {
      return res.status(400).json({ error: "leadIds or filters required" });
    }

    // Process leads — call webhook for each
    const results: { id: number; success: boolean; fitScore?: number; error?: string }[] = [];
    let enriched = 0;
    let failed = 0;

    for (const lead of leads) {
      const url = lead.linkedin_url || lead.sales_nav_url;
      if (!url) {
        results.push({ id: lead.id, success: false, error: "No LinkedIn URL" });
        failed++;
        continue;
      }

      try {
        const webhookRes = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!webhookRes.ok) {
          results.push({ id: lead.id, success: false, error: `Webhook ${webhookRes.status}` });
          failed++;
          continue;
        }

        const data = await webhookRes.json();
        const enrichment = Array.isArray(data) ? data[0] : data;

        if (!enrichment || enrichment.fit_score == null) {
          results.push({ id: lead.id, success: false, error: "No score in response" });
          failed++;
          continue;
        }

        const fitScore = enrichment.fit_score;
        const fitAnalysis = JSON.stringify({
          criteria: enrichment.result,
          summary: enrichment.summary || "",
        });

        await sql`
          UPDATE leads SET fit_score = ${fitScore}, fit_analysis = ${fitAnalysis}
          WHERE id = ${lead.id}
        `;

        results.push({ id: lead.id, success: true, fitScore });
        enriched++;
      } catch (err: any) {
        results.push({ id: lead.id, success: false, error: err.message });
        failed++;
      }
    }

    return res.status(200).json({
      success: true,
      total: leads.length,
      enriched,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("Bulk enrich error:", err);
    return res.status(500).json({ error: err.message });
  }
}
