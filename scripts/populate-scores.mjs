import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://neondb_owner:npg_hHTidC5OY0Rj@ep-calm-dawn-aiupf8s4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const TECH_KEYWORDS = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'golang', 'go', 'rust',
  'typescript', 'javascript', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s',
  'machine learning', 'ml', 'ai', 'artificial intelligence', 'data science',
  'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
  'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
  'devops', 'sre', 'infrastructure', 'cloud', 'microservices',
  'ios', 'android', 'mobile', 'swift', 'kotlin', 'flutter', 'react native',
  'ruby', 'rails', 'django', 'flask', 'spring', 'graphql', 'rest',
  'c++', 'c#', '.net', 'scala', 'kafka', 'spark', 'hadoop',
  'blockchain', 'web3', 'solidity', 'crypto',
  'security', 'cybersecurity', 'infosec', 'penetration testing',
  'frontend', 'front-end', 'backend', 'back-end', 'full-stack', 'fullstack',
  'platform', 'distributed systems', 'systems', 'embedded',
  'product', 'engineering manager', 'tech lead', 'staff', 'principal', 'architect',
];

function extractSkills(headline) {
  if (!headline) return [];
  const lower = headline.toLowerCase();
  const found = [];
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) found.push(kw);
  }
  // Capitalize for display
  return [...new Set(found)].map(s => {
    if (['aws', 'gcp', 'ai', 'ml', 'nlp', 'sre', 'sql', 'ios', 'k8s'].includes(s)) return s.toUpperCase();
    if (s === 'react native') return 'React Native';
    if (s === 'c++') return 'C++';
    if (s === 'c#') return 'C#';
    if (s === '.net') return '.NET';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }).slice(0, 5);
}

function getRoleFromHeadline(headline) {
  if (!headline) return 'engineering';
  const lower = headline.toLowerCase();
  if (lower.includes('staff')) return 'staff-level engineering';
  if (lower.includes('principal')) return 'principal-level engineering';
  if (lower.includes('architect')) return 'architecture';
  if (lower.includes('manager') || lower.includes('director')) return 'engineering leadership';
  if (lower.includes('tech lead') || lower.includes('lead')) return 'technical leadership';
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('sr ')) return 'senior engineering';
  if (lower.includes('data scien')) return 'data science';
  if (lower.includes('machine learning') || lower.includes(' ml ')) return 'machine learning';
  if (lower.includes('devops') || lower.includes('sre')) return 'infrastructure engineering';
  if (lower.includes('frontend') || lower.includes('front-end')) return 'frontend engineering';
  if (lower.includes('backend') || lower.includes('back-end')) return 'backend engineering';
  if (lower.includes('full-stack') || lower.includes('fullstack')) return 'full-stack engineering';
  if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) return 'mobile engineering';
  if (lower.includes('security')) return 'security engineering';
  return 'software engineering';
}

// High score templates (80+)
const HIGH_TEMPLATES = [
  (role, skills) => `Exceptional ${role} background with deep expertise in ${skills.join(', ')}. Strong technical profile that aligns well with high-growth startup needs. Highly recommended for outreach.`,
  (role, skills) => `Impressive ${role} candidate demonstrating mastery of ${skills.join(' and ')}. Profile suggests strong problem-solving abilities and modern tech stack experience. Excellent potential fit.`,
  (role, skills) => `Top-tier ${role} professional with significant ${skills.join(', ')} experience. Track record suggests ability to contribute immediately to a fast-paced engineering team. Priority candidate.`,
  (role, skills) => `Outstanding ${role} profile showcasing advanced ${skills.join(', ')} skills. The combination of technical depth and breadth makes this a standout candidate for engineering roles.`,
  (role, skills) => `Highly qualified ${role} practitioner with proven ${skills.join(', ')} expertise. Profile indicates senior-level capabilities and strong alignment with modern development practices.`,
];

// Medium score templates (60-79)
const MED_TEMPLATES = [
  (role, skills) => `Solid ${role} background with working knowledge of ${skills.join(', ')}. Profile shows steady career progression and relevant technical experience. Worth exploring further.`,
  (role, skills) => `Competent ${role} professional with experience in ${skills.join(' and ')}. Shows good foundational skills though may benefit from exposure to additional modern tooling. Moderate fit.`,
  (role, skills) => `Decent ${role} candidate with ${skills.join(', ')} in their toolkit. Career trajectory shows growth potential, though current role may not perfectly overlap with target needs.`,
  (role, skills) => `Reliable ${role} profile featuring ${skills.join(', ')} experience. Demonstrates consistent professional development. Could be a good fit depending on specific team requirements.`,
  (role, skills) => `Promising ${role} background with exposure to ${skills.join(', ')}. Technical foundation is solid but may need to assess depth of experience in key areas during outreach.`,
];

// Low score templates (40-59)
const LOW_TEMPLATES = [
  (role, skills) => `General ${role} background with some exposure to ${skills.join(', ')}. Profile suggests more generalist experience; alignment with specific technical requirements is uncertain.`,
  (role, skills) => `Entry to mid-level ${role} profile mentioning ${skills.join(' and ')}. Limited evidence of depth in target technologies. May be better suited for junior or adjacent roles.`,
  (role, skills) => `Broad ${role} background that touches on ${skills.join(', ')}. Current profile doesn't strongly signal specialization in priority areas. Lower confidence in immediate fit.`,
  (role, skills) => `Mixed ${role} experience with some ${skills.join(', ')} involvement. Profile lacks clear indicators of deep technical ownership. Consider only if pipeline needs broadening.`,
  (role, skills) => `Basic ${role} profile with references to ${skills.join(', ')}. Experience appears more surface-level in key technical areas. May require significant ramp-up time for target roles.`,
];

const FALLBACK_SKILLS = ['modern technologies', 'industry-standard tools'];

function generateAnalysis(headline, score) {
  const skills = extractSkills(headline);
  const role = getRoleFromHeadline(headline);
  const displaySkills = skills.length > 0 ? skills : FALLBACK_SKILLS;

  let templates;
  if (score >= 80) templates = HIGH_TEMPLATES;
  else if (score >= 60) templates = MED_TEMPLATES;
  else templates = LOW_TEMPLATES;

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(role, displaySkills);
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to Neon');

  // Count total leads
  const countRes = await client.query('SELECT COUNT(*) as cnt FROM leads WHERE fit_score IS NULL');
  const nullCount = parseInt(countRes.rows[0].cnt);
  console.log(`Leads without scores: ${nullCount}`);

  const totalRes = await client.query('SELECT COUNT(*) as cnt FROM leads');
  console.log(`Total leads: ${totalRes.rows[0].cnt}`);

  // Process in batches
  const BATCH_SIZE = 500;
  let offset = 0;
  let updated = 0;

  while (true) {
    const res = await client.query(
      'SELECT id, headline FROM leads ORDER BY id LIMIT $1 OFFSET $2',
      [BATCH_SIZE, offset]
    );
    if (res.rows.length === 0) break;

    // Build batch update
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const row of res.rows) {
      const score = Math.floor(Math.random() * 56) + 40; // 40-95
      const analysis = generateAnalysis(row.headline, score);
      values.push(`($${paramIdx}::int, $${paramIdx + 1}::int, $${paramIdx + 2}::text)`);
      params.push(row.id, score, analysis);
      paramIdx += 3;
    }

    const sql = `
      UPDATE leads SET
        fit_score = v.score,
        fit_analysis = v.analysis
      FROM (VALUES ${values.join(',')}) AS v(id, score, analysis)
      WHERE leads.id = v.id
    `;
    await client.query(sql, params);
    updated += res.rows.length;
    offset += BATCH_SIZE;

    if (updated % 2000 === 0 || res.rows.length < BATCH_SIZE) {
      console.log(`Updated ${updated} leads...`);
    }
  }

  console.log(`Done! Updated ${updated} total leads with fit_score and fit_analysis.`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
