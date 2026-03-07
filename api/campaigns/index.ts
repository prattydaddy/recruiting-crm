import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET /api/campaigns ----------
    if (req.method === "GET") {
      const rows = await sql`
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
      return res.json({ data: rows });
    }

    // ---------- POST /api/campaigns ----------
    if (req.method === "POST") {
      const { name, description } = req.body || {};
      if (!name) return res.status(400).json({ error: "name is required" });

      const rows = await sql`
        INSERT INTO campaigns (name, description)
        VALUES (${name}, ${description || null})
        RETURNING id, name, description, status, created_at as "createdAt", updated_at as "updatedAt"
      `;
      return res.status(201).json({ data: { ...rows[0], leadCount: 0 } });
    }

    // ---------- PATCH /api/campaigns ----------
    if (req.method === "PATCH") {
      const { id, name, description, status } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required" });

      const sets: string[] = [];
      const params: (string | number)[] = [];
      let paramIdx = 1;

      if (name !== undefined) { sets.push(`name = $${paramIdx}`); params.push(name); paramIdx++; }
      if (description !== undefined) { sets.push(`description = $${paramIdx}`); params.push(description); paramIdx++; }
      if (status !== undefined) { sets.push(`status = $${paramIdx}`); params.push(status); paramIdx++; }
      sets.push("updated_at = NOW()");

      if (sets.length === 1) return res.status(400).json({ error: "No fields to update" });

      const query = `UPDATE campaigns SET ${sets.join(", ")} WHERE id = $${paramIdx} RETURNING id, name, description, status, created_at as "createdAt", updated_at as "updatedAt"`;
      params.push(id);

      const rows = await sql.query(query, params);
      if (rows.length === 0) return res.status(404).json({ error: "Campaign not found" });
      return res.json({ data: rows[0] });
    }

    // ---------- DELETE /api/campaigns ----------
    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required" });

      await sql`DELETE FROM campaigns WHERE id = ${id}`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Campaigns API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
