import fs from "fs";
import path from "path";
import { prisma } from "../src/client";

type Row = { phone: string; gender: "FEMALE" | "MALE" | "LGBTQ" | "UNSPECIFIED" };

async function main() {
  const rows: Row[] = JSON.parse(fs.readFileSync(path.join(__dirname, "import-gender-data.json"), "utf-8"));
  let updated = 0;
  let notFound = 0;
  for (const row of rows) {
    const res = await prisma.customer.updateMany({ where: { phone: row.phone }, data: { gender: row.gender } });
    if (res.count > 0) updated += 1;
    else notFound += 1;
  }
  console.log(JSON.stringify({ total: rows.length, updated, notFound }));
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
