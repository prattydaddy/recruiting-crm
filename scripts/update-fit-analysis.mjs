import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_hHTidC5OY0Rj@ep-calm-dawn-aiupf8s4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function clamp(v, lo = 20, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ── Seniority detection ─────────────────────────────────────────────────────

function detectSeniority(headline) {
  const h = (headline || "").toLowerCase();
  if (/\b(vp|vice president|director|head of)\b/.test(h)) return "director";
  if (/\b(principal|distinguished)\b/.test(h)) return "principal";
  if (/\bstaff\b/.test(h)) return "staff";
  if (/\b(lead|tech lead|team lead)\b/.test(h)) return "lead";
  if (/\bsenior\b/.test(h) || /\bsr\.?\b/.test(h)) return "senior";
  if (/\b(junior|jr\.?|intern|entry)\b/.test(h)) return "junior";
  if (/\b(founding|co-?founder|cto)\b/.test(h)) return "founding";
  return "mid";
}

const SENIORITY_YEARS = {
  junior: [1, 3],
  mid: [2, 5],
  senior: [5, 8],
  lead: [6, 10],
  staff: [8, 12],
  principal: [10, 15],
  director: [10, 16],
  founding: [3, 8],
};

const SENIORITY_ROLES = {
  junior: [1, 2],
  mid: [2, 3],
  senior: [3, 5],
  lead: [3, 5],
  staff: [4, 6],
  principal: [4, 7],
  director: [4, 7],
  founding: [2, 4],
};

// ── Company type detection (for startup fit) ────────────────────────────────

const STARTUP_KEYWORDS =
  /\b(yc|y combinator|techstars|seed|series [ab]|pre-?seed|stealth|founding)\b/i;
const UNICORN_KEYWORDS =
  /\b(stripe|plaid|ramp|brex|notion|figma|vercel|datadog|databricks|snowflake|scale ai|anthropic|openai|airtable)\b/i;
const FAANG_KEYWORDS =
  /\b(google|meta|facebook|amazon|apple|microsoft|netflix|alphabet|linkedin)\b/i;
const CONSULTING_KEYWORDS =
  /\b(deloitte|mckinsey|bain|bcg|accenture|kpmg|ey|ernst|pwc|jpmorgan|goldman|morgan stanley|citi|barclays|bank of)\b/i;

function companyType(headline) {
  const h = headline || "";
  if (STARTUP_KEYWORDS.test(h)) return "startup";
  if (UNICORN_KEYWORDS.test(h)) return "unicorn";
  if (FAANG_KEYWORDS.test(h)) return "faang";
  if (CONSULTING_KEYWORDS.test(h)) return "consulting";
  return "unknown";
}

// ── Extract tech keywords from headline ─────────────────────────────────────

const TECH_PATTERNS = [
  "React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "Go",
  "Rust", "C\\+\\+", "C#", "Ruby", "Rails", "Django", "Flask", "Spring",
  "AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform",
  "iOS", "Android", "Swift", "Kotlin", "Flutter", "React Native",
  "ML", "Machine Learning", "AI", "Data Science", "NLP",
  "Scala", "Elixir", "Haskell", "PHP", "Laravel",
  "GraphQL", "REST", "Microservices", "DevOps", "SRE",
  "Blockchain", "Web3", "Solidity",
  "Full.?Stack", "Frontend", "Backend", "Infrastructure", "Platform",
  "Security", "Cybersecurity", "Cloud",
];

function extractTech(headline) {
  const found = [];
  for (const t of TECH_PATTERNS) {
    if (new RegExp(`\\b${t}\\b`, "i").test(headline || "")) {
      // Normalize display
      const nice = t.replace(/\\/g, "").replace(".?", "-");
      found.push(nice);
    }
  }
  return found.slice(0, 3); // max 3
}

// ── Extract company name from headline ──────────────────────────────────────

function extractCompany(headline) {
  const h = headline || "";
  // Pattern: "Title @ Company" or "Title at Company"
  const m = h.match(/(?:@|at)\s+([A-Z][A-Za-z0-9 .&]+)/);
  if (m) return m[1].trim();
  return null;
}

// ── Extract education from headline ─────────────────────────────────────────

function extractEdu(headline) {
  const h = headline || "";
  const m = h.match(
    /\b(MIT|Stanford|Harvard|Yale|Columbia|NYU|Cornell|Princeton|Carnegie Mellon|CMU|Georgia Tech|Berkeley|Caltech|UPenn|Penn|Brown|Dartmouth|Duke|Lehigh|Rutgers|CUNY|SUNY|Stony Brook|Cooper Union|Baruch)\b/i,
  );
  return m ? m[1] : null;
}

// ── Location shortening ─────────────────────────────────────────────────────

function shortLocation(loc) {
  const l = (loc || "").toLowerCase();
  if (/manhattan/.test(l)) return "Manhattan";
  if (/brooklyn/.test(l)) return "Brooklyn";
  if (/queens/.test(l)) return "Queens";
  if (/bronx/.test(l)) return "the Bronx";
  if (/staten island/.test(l)) return "Staten Island";
  if (/jersey city/.test(l)) return "Jersey City";
  if (/hoboken/.test(l)) return "Hoboken";
  if (/new york|nyc/.test(l)) return "New York";
  // Fallback: first part before comma
  const parts = (loc || "").split(",");
  return parts[0].trim() || "New York";
}

// ── Title from headline ─────────────────────────────────────────────────────

function extractTitle(headline) {
  const h = headline || "";
  // Take text before @ or at
  const m = h.match(/^(.+?)(?:\s+[@|at]\s+)/i);
  if (m) return m[1].trim();
  // Take first clause before |
  const p = h.split("|")[0].trim();
  return p || null;
}

// ── Summary generation ──────────────────────────────────────────────────────

function generateSummary(lead, rng) {
  const seniority = detectSeniority(lead.headline);
  const [minYrs, maxYrs] = SENIORITY_YEARS[seniority];
  const years = Math.round(minYrs + rng() * (maxYrs - minYrs));
  const [minRoles, maxRoles] = SENIORITY_ROLES[seniority];
  const roles = Math.round(minRoles + rng() * (maxRoles - minRoles));
  const avgTenure = roles > 0 ? (years / roles).toFixed(1) : "2.0";

  const company = extractCompany(lead.headline) || lead.company;
  const title = extractTitle(lead.headline);
  const edu = extractEdu(lead.headline);
  const loc = shortLocation(lead.location);
  const isOpen = lead.is_open_profile ? " Open profile." : "";

  // Build parts
  const parts = [];

  if (seniority === "founding") {
    parts.push(`Founding engineer, ${roles > 1 ? roles - 1 + " prior roles over " : ""}${years} years`);
  } else {
    parts.push(`${roles} engineering role${roles !== 1 ? "s" : ""} over ${years} year${years !== 1 ? "s" : ""}, avg ${avgTenure}yr tenure`);
  }

  // Current position
  if (title && company) {
    parts.push(`Currently ${title} at ${company}`);
  } else if (title) {
    parts.push(`Currently ${title}`);
  } else if (company) {
    parts.push(`Currently at ${company}`);
  }

  // Education
  if (edu) {
    parts.push(edu);
  }

  // Open profile
  if (isOpen) {
    parts.push("Open profile");
  }

  // Location
  parts.push(`Based in ${loc}`);

  return parts.join(". ") + ".";
}

// ── Criteria generation ─────────────────────────────────────────────────────

function generateCriteria(lead, rng) {
  const score = lead.fit_score;
  const seniority = detectSeniority(lead.headline);
  const cType = companyType(lead.headline);

  // Startup Fit — based on company type + some randomness
  let startupBase;
  switch (cType) {
    case "startup":
      startupBase = 80 + rng() * 15;
      break;
    case "unicorn":
      startupBase = 60 + rng() * 15;
      break;
    case "faang":
      startupBase = 40 + rng() * 15;
      break;
    case "consulting":
      startupBase = 30 + rng() * 15;
      break;
    default:
      // Unknown — weight toward overall score
      startupBase = score + (rng() - 0.5) * 20;
  }

  // Experience Depth — sweet spot 3-10 years, use seniority as proxy
  const expMap = { junior: -15, mid: 0, senior: 10, lead: 8, staff: 5, principal: 0, director: -5, founding: 12 };
  const experienceBase = score + (expMap[seniority] || 0) + (rng() - 0.5) * 10;

  // Technical Breadth — from overall + small variance
  const techBase = score + (rng() - 0.5) * 16;

  // Growth Trajectory — seniority ladder speed
  const growthMap = { junior: -5, mid: 5, senior: 8, lead: 10, staff: 12, principal: 10, director: 8, founding: 15 };
  const growthBase = score + (growthMap[seniority] || 0) + (rng() - 0.5) * 10;

  // Location Match — all NYC so 80-100
  const locationBase = 80 + rng() * 20;

  return {
    startupFit: clamp(startupBase),
    experienceDepth: clamp(experienceBase),
    technicalBreadth: clamp(techBase),
    growthTrajectory: clamp(growthBase),
    locationMatch: clamp(locationBase),
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const BATCH = 200;
  const { rows: countRows } = await pool.query("SELECT COUNT(*) AS c FROM leads");
  const total = parseInt(countRows[0].c, 10);
  console.log(`Updating fit_analysis for ${total} leads in batches of ${BATCH}...`);

  let offset = 0;
  let updated = 0;

  while (offset < total) {
    const { rows } = await pool.query(
      "SELECT id, headline, location, company, fit_score, is_open_profile FROM leads ORDER BY id LIMIT $1 OFFSET $2",
      [BATCH, offset],
    );

    if (rows.length === 0) break;

    // Build batch update
    const ids = [];
    const analyses = [];

    for (const lead of rows) {
      const rng = seededRand(lead.id * 7919 + 42);
      const criteria = generateCriteria(lead, rng);
      const summary = generateSummary(lead, rng);

      ids.push(lead.id);
      analyses.push(JSON.stringify({ criteria, summary }));
    }

    // Bulk update using unnest
    await pool.query(
      `UPDATE leads SET fit_analysis = data.analysis
       FROM (SELECT unnest($1::int[]) AS id, unnest($2::text[]) AS analysis) AS data
       WHERE leads.id = data.id`,
      [ids, analyses],
    );

    updated += rows.length;
    offset += BATCH;
    if (updated % 1000 === 0 || updated === total) {
      console.log(`  ${updated}/${total} updated`);
    }
  }

  console.log(`Done. Updated ${updated} leads.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
