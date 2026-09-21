// Prisma's generated client bakes an absolute path (captured at `prisma generate` time)
// as one of its query-engine search candidates. On Vercel, the build container's cwd
// (/vercel/path0/...) differs from the runtime lambda's cwd (/var/task/<rootDirectory>/...),
// so that baked-in absolute path is always stale at runtime for monorepo setups where the
// Prisma output lives in a sibling package (packages/db-finance) rather than this app.
//
// Prisma's runtime engine-locator ALSO always tries "<app>/node_modules/.prisma/client-finance"
// as a candidate automatically, with no config needed. So instead of fighting the stale
// absolute path, this script just makes sure a copy of the generated client (engine binary
// included) physically exists there too, and next.config.js's outputFileTracingIncludes
// tells Next.js to bundle it into the deployed function.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "packages", "db-finance", "node_modules", ".prisma", "client-finance");
const dest = path.join(__dirname, "..", "node_modules", ".prisma", "client-finance");

if (!fs.existsSync(src)) {
  console.warn("[copy-prisma-engine] source not found, skipping:", src);
  process.exit(0);
}

fs.cpSync(src, dest, { recursive: true });
console.log(`[copy-prisma-engine] copied ${src} to ${dest}`);
