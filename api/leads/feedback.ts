import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ---------- GET /api/leads/feedback?leadId=123 ----------
  if (req.method === "GET") {
    const leadId = parseInt(req.query.leadId as string);
    if (!leadId) return res.status(400).json({ error: "leadId is required" });

    try {
      const rows = await sql`
        SELECT id, lead_id as "leadId", feedback, rating, created_at as "createdAt"
        FROM lead_feedback
        WHERE lead_id = ${leadId}
        ORDER BY created_at DESC
      `;
      return res.json({ data: rows });
    } catch (err) {
      console.error("Feedback GET error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ---------- POST /api/leads/feedback ----------
  if (req.method === "POST") {
    const { leadId, feedback, rating } = req.body || {};
    if (!leadId || !feedback) {
      return res.status(400).json({ error: "leadId and feedback are required" });
    }

    try {
      const rows = await sql`
        INSERT INTO lead_feedback (lead_id, feedback, rating)
        VALUES (${leadId}, ${feedback}, ${rating || null})
        RETURNING id, lead_id as "leadId", feedback, rating, created_at as "createdAt"
      `;
      return res.status(201).json({ ok: true, data: rows[0] });
    } catch (err) {
      console.error("Feedback POST error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
