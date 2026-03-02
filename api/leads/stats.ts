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

  try {
    const [totalRow] = await sql`SELECT COUNT(*) as total FROM leads`;
    const segmentRows = await sql`SELECT segment, COUNT(*) as count FROM leads GROUP BY segment ORDER BY segment`;
    const stageRows = await sql`SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY stage`;
    const openProfileRow = await sql`SELECT COUNT(*) as count FROM leads WHERE is_open_profile = true`;

    return res.json({
      total: parseInt(totalRow.total),
      bySegment: segmentRows.map((r: Record<string, string>) => ({ segment: r.segment, count: parseInt(r.count) })),
      byStage: stageRows.map((r: Record<string, string>) => ({ stage: r.stage, count: parseInt(r.count) })),
      openProfiles: parseInt(openProfileRow[0].count),
    });
  } catch (err) {
    console.error("Leads stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
