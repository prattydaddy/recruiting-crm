import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  if (req.method === "PATCH") {
    const updates = req.body;
    // Build dynamic update — only stage for now but extensible
    if (updates.stage) {
      await sql`UPDATE candidates SET stage = ${updates.stage} WHERE id = ${id as string}`;
    }
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM candidates WHERE id = ${id as string}`;
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
