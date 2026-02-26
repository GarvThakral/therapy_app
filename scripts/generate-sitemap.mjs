import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BLOG_POSTS_PATH = path.join(ROOT, "src", "app", "data", "blog-posts.ts");
const PUBLIC_DIR = path.join(ROOT, "public");
const SITEMAP_PATH = path.join(PUBLIC_DIR, "sitemap.xml");
const ROBOTS_PATH = path.join(PUBLIC_DIR, "robots.txt");
const ENV_PATH = path.join(ROOT, ".env");

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadLocalEnv();

const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://example.com").replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  "/",
  "/auth",
  "/onboarding",
  "/blog",
  "/privacy",
  "/terms",
  "/contact",
  "/app",
  "/app/next-session",
  "/app/post-session",
  "/app/past-sessions",
  "/app/homework",
  "/app/patterns",
  "/app/discussions",
  "/app/settings",
];

function extractBlogSlugs() {
  if (!fs.existsSync(BLOG_POSTS_PATH)) return [];
  const file = fs.readFileSync(BLOG_POSTS_PATH, "utf8");
  const matches = [...file.matchAll(/slug:\s*'([^']+)'/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function routePriority(route) {
  if (route === "/") return "1.0";
  if (route === "/blog") return "0.9";
  if (route.startsWith("/blog/")) return "0.8";
  if (route.startsWith("/app")) return "0.7";
  return "0.6";
}

const blogRoutes = extractBlogSlugs().map((slug) => `/blog/${slug}`);
const routes = [...new Set([...staticRoutes, ...blogRoutes])];

const urlEntries = routes
  .map((route) => {
    const loc = xmlEscape(`${siteUrl}${route}`);
    const priority = routePriority(route);
    const changefreq = route.startsWith("/blog/") ? "weekly" : "monthly";
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(SITEMAP_PATH, sitemap, "utf8");
fs.writeFileSync(ROBOTS_PATH, robots, "utf8");

console.log(`Generated sitemap with ${routes.length} routes at ${SITEMAP_PATH}`);
