const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const LEADS_DIR = path.join(__dirname, "..", "data", "leads");
const BATCH_SIZE = 200;
const CSV_FILES = [
  "segment-1a.csv",
  "segment-1b.csv",
  "segment-1c.csv",
  "segment-2b.csv",
  "segment-2c.csv",
];

function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const rows = [];

  // Handles multiline quoted fields by reassembling split lines
  let pending = null;
  for (let i = 1; i < lines.length; i++) {
    const line = pending ? pending + "\n" + lines[i] : lines[i];
    const quoteCount = (line.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      pending = line;
      continue;
    }
    pending = null;

    const fields = parseCSVLine(line);
    if (fields.length < 9) continue;

    const [
      firstName,
      lastName,
      headline,
      company,
      location,
      salesNavUrl,
      linkedinUrl,
      linkedinId,
      isOpenProfile,
    ] = fields;

    if (!firstName && !lastName) continue;

    rows.push({
      firstName: firstName || "",
      lastName: lastName || "",
      headline: headline || "",
      company: company || "",
      location: location || "",
      salesNavUrl: salesNavUrl || "",
      linkedinUrl: linkedinUrl || "",
      linkedinId: linkedinId || "",
      isOpenProfile: isOpenProfile?.toLowerCase() === "true",
    });
  }
  return rows;
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(DATABASE_URL);

  console.log("Connected to Neon database");

  // --- Seed leads ---
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of CSV_FILES) {
    const segment = path.basename(file, ".csv");
    const filePath = path.join(LEADS_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }

    const rows = parseCSVFile(filePath);
    console.log(`Parsed ${file}: ${rows.length} rows`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const params = [];
      const valueSets = [];

      batch.forEach((row, idx) => {
        const offset = idx * 10;
        valueSets.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`
        );
        params.push(
          row.firstName,
          row.lastName,
          row.headline || null,
          row.company || null,
          row.location || null,
          row.salesNavUrl || null,
          row.linkedinUrl || null,
          row.linkedinId || null,
          row.isOpenProfile,
          segment
        );
      });

      const query = `INSERT INTO leads (first_name, last_name, headline, company, location, sales_nav_url, linkedin_url, linkedin_id, is_open_profile, segment)
VALUES ${valueSets.join(", ")}`;

      try {
        const result = await sql.query(query, params);
        const inserted = typeof result?.count === "number" ? result.count : batch.length;
        totalInserted += inserted;
        totalSkipped += batch.length - inserted;
      } catch (err) {
        console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1} of ${file}:`, err.message);
        // Try inserting one by one for this batch to salvage what we can
        for (const row of batch) {
          try {
            await sql.query(
              `INSERT INTO leads (first_name, last_name, headline, company, location, sales_nav_url, linkedin_url, linkedin_id, is_open_profile, segment)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                row.firstName,
                row.lastName,
                row.headline || null,
                row.company || null,
                row.location || null,
                row.salesNavUrl || null,
                row.linkedinUrl || null,
                row.linkedinId || null,
                row.isOpenProfile,
                segment,
              ]
            );
            totalInserted++;
          } catch (e) {
            totalSkipped++;
          }
        }
      }

      process.stdout.write(
        `\r  ${file}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} processed`
      );
    }
    console.log();
  }

  console.log(`\nLeads seeding complete: ${totalInserted} inserted, ${totalSkipped} skipped (duplicates)`);

  // --- Seed candidates ---
  console.log("\nSeeding candidates table...");
  const candidates = [
    ["c1","Jordan Mitchell","Senior Engineer","Google","https://linkedin.com/in/jordanm","San Francisco, CA",8,92,"2026-02-20","sourced","Acme Corp","GTM Engineer"],
    ["c2","Priya Sharma","Staff Engineer","Meta","https://linkedin.com/in/priyas","New York, NY",10,87,"2026-02-19","screening","Acme Corp","Full Stack Dev"],
    ["c3","Marcus Chen","DevOps Lead","Stripe","https://linkedin.com/in/marcusc","Seattle, WA",6,74,"2026-02-18","interview","TechStart Inc","DevOps Engineer"],
    ["c4","Emily Rodriguez","VP Revenue","Datadog","https://linkedin.com/in/emilyr","Austin, TX",14,95,"2026-02-17","offer","Nexus AI","VP Sales"],
    ["c5","Alex Kim","AE","Salesforce","https://linkedin.com/in/alexk","Chicago, IL",5,68,"2026-02-21","sourced","Acme Corp","Account Executive"],
    ["c6","Sarah Thompson","Product Designer","Figma","https://linkedin.com/in/saraht","San Francisco, CA",7,88,"2026-02-16","hired","TechStart Inc","Senior Designer"],
    ["c7","David Park","SDR Manager","HubSpot","https://linkedin.com/in/davidp","Boston, MA",4,55,"2026-02-22","sourced","Pinnacle Labs","SDR"],
    ["c8","Lisa Wang","UX Researcher","Apple","https://linkedin.com/in/lisaw","Cupertino, CA",9,91,"2026-02-15","screening","Nexus AI","UX Researcher"],
    ["c9","James Foster","Full Stack Dev","Vercel","https://linkedin.com/in/jamesf","Remote",5,79,"2026-02-20","interview","Acme Corp","Full Stack Dev"],
    ["c10","Nina Patel","GTM Engineer","Twilio","https://linkedin.com/in/ninap","Denver, CO",3,62,"2026-02-23","sourced","TechStart Inc","GTM Engineer"],
    ["c11","Ryan O'Brien","Sr. AE","Gong","https://linkedin.com/in/ryano","San Francisco, CA",7,84,"2026-02-14","offer","Pinnacle Labs","Account Executive"],
    ["c12","Amanda Liu","Platform Engineer","Netflix","https://linkedin.com/in/amandal","Los Angeles, CA",8,90,"2026-02-19","screening","Acme Corp","DevOps Engineer"],
    ["c13","Carlos Mendez","Design Lead","Airbnb","https://linkedin.com/in/carlosm","San Francisco, CA",11,93,"2026-02-13","interview","Nexus AI","Senior Designer"],
    ["c14","Olivia Brown","BDR","Outreach","https://linkedin.com/in/oliviab","Seattle, WA",2,45,"2026-02-22","rejected","TechStart Inc","SDR"],
    ["c15","Tom Nguyen","Solutions Engineer","Cloudflare","https://linkedin.com/in/tomn","Austin, TX",6,76,"2026-02-18","sourced","Nexus AI","GTM Engineer"],
    ["c16","Rachel Adams","VP Sales","Confluent","https://linkedin.com/in/rachela","New York, NY",15,97,"2026-02-12","hired","Acme Corp","VP Sales"],
    ["c17","Kevin Lee","Frontend Dev","Shopify","https://linkedin.com/in/kevinl","Toronto, ON",4,71,"2026-02-21","screening","Pinnacle Labs","Full Stack Dev"],
    ["c18","Michelle Torres","UX Lead","Spotify","https://linkedin.com/in/michellet","New York, NY",8,86,"2026-02-17","interview","TechStart Inc","UX Researcher"],
    ["c19","Daniel Wright","DevOps Engineer","Hashicorp","https://linkedin.com/in/danielw","Portland, OR",7,82,"2026-02-20","offer","Acme Corp","DevOps Engineer"],
    ["c20","Sophie Martin","SDR","Drift","https://linkedin.com/in/sophiem","Boston, MA",1,38,"2026-02-23","rejected","Pinnacle Labs","SDR"],
    ["c21","Chris Jackson","GTM Lead","Notion","https://linkedin.com/in/chrisj","San Francisco, CA",9,89,"2026-02-16","sourced","Acme Corp","GTM Engineer"],
    ["c22","Aisha Hassan","Sr. Designer","Linear","https://linkedin.com/in/aishah","Remote",6,85,"2026-02-19","screening","Nexus AI","Senior Designer"],
    ["c23","Ben Cooper","AE","Rippling","https://linkedin.com/in/benc","San Francisco, CA",3,58,"2026-02-21","sourced","TechStart Inc","Account Executive"],
  ];

  for (const c of candidates) {
    try {
      await sql.query(
        `INSERT INTO candidates (id, name, position, company, linkedin_url, location, experience_years, fit_score, date_added, stage, account, target_position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        c
      );
    } catch (err) {
      console.error(`Failed to insert candidate ${c[0]}:`, err.message);
    }
  }
  console.log(`Candidates seeded: ${candidates.length} entries`);

  // --- Final counts ---
  const leadsResult = await sql.query("SELECT COUNT(*) as count FROM leads");
  const candidatesResult = await sql.query("SELECT COUNT(*) as count FROM candidates");
  const leadsCount = leadsResult[0].count;
  const candidatesCount = candidatesResult[0].count;
  console.log(`\nFinal counts: ${leadsCount} leads, ${candidatesCount} candidates`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
