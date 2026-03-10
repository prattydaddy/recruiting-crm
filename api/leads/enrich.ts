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

  const { leadId, linkedinUrl } = req.body || {};

  if (!leadId || !linkedinUrl) {
    return res.status(400).json({ error: "leadId and linkedinUrl are required" });
  }

  try {
    // Call the enrichment webhook
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: linkedinUrl }),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      return res.status(502).json({ error: "Webhook failed", detail: text });
    }

    const data = await webhookRes.json();

    // Response is an array — take first element
    const enrichment = Array.isArray(data) ? data[0] : data;

    if (!enrichment || enrichment.fit_score == null) {
      return res.status(502).json({ error: "Unexpected webhook response", data });
    }

    const fitScore = enrichment.fit_score;
    const fitAnalysis = JSON.stringify({
      criteria: enrichment.result,
      summary: enrichment.summary || "",
    });

    // Update the lead in Neon
    await sql`
      UPDATE leads
      SET fit_score = ${fitScore}, fit_analysis = ${fitAnalysis}
      WHERE id = ${leadId}
    `;

    return res.status(200).json({
      success: true,
      leadId,
      fitScore,
      fitAnalysis: JSON.parse(fitAnalysis),
    });
  } catch (err: any) {
    console.error("Enrich error:", err);
    return res.status(500).json({ error: err.message });
  }
}
