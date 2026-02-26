import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const rows = await sql`SELECT id, name, position, company, linkedin_url as "linkedinUrl", location, experience_years as "experienceYears", fit_score as "fitScore", date_added as "dateAdded", stage, account, target_position as "targetPosition" FROM candidates ORDER BY date_added DESC`;
    return res.json(rows);
  }

  if (req.method === "POST") {
    const c = req.body;
    const id = "c" + Date.now();
    await sql`INSERT INTO candidates (id, name, position, company, linkedin_url, location, experience_years, fit_score, date_added, stage, account, target_position) VALUES (${id}, ${c.name}, ${c.position}, ${c.company}, ${c.linkedinUrl}, ${c.location}, ${c.experienceYears}, ${c.fitScore}, ${c.dateAdded || new Date().toISOString().slice(0,10)}, ${c.stage || 'sourced'}, ${c.account}, ${c.targetPosition})`;
    return res.status(201).json({ id, ...c });
  }

  res.status(405).json({ error: "Method not allowed" });
}
