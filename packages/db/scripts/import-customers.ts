import fs from "fs";
import path from "path";
import { prisma } from "../src/client";
import { computeExpiryDate } from "../src/expiry";

type ImportRow = { name: string; phone: string; dob: string | null; points: number; lifetime: number };

const IMPORT_NOTE = "นำเข้าจากระบบเดิม (LINE CRM)";

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, "import-customers-data.json"), "utf-8");
  const rows: ImportRow[] = JSON.parse(raw);

  let created = 0;
  let mergedIntoExisting = 0;
  let skippedNoPointsNew = 0;

  for (const row of rows) {
    const dob = row.dob ? new Date(row.dob) : null;

    const existing = await prisma.customer.findUnique({ where: { phone: row.phone } });

    if (existing) {
      if (row.points > 0) {
        await prisma.$transaction([
          prisma.customer.update({
            where: { id: existing.id },
            data: { pointsBalance: { increment: row.points }, lifetimePoints: { increment: row.points } },
          }),
          prisma.pointTransaction.create({
            data: {
              customerId: existing.id,
              type: "EARN",
              points: row.points,
              note: IMPORT_NOTE,
              expiresAt: computeExpiryDate(),
            },
          }),
        ]);
      }
      mergedIntoExisting += 1;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          phone: row.phone,
          name: row.name || null,
          dateOfBirth: dob,
          pointsBalance: row.points,
          lifetimePoints: row.points,
        },
      });
      if (row.points > 0) {
        await prisma.pointTransaction.create({
          data: {
            customerId: newCustomer.id,
            type: "EARN",
            points: row.points,
            note: IMPORT_NOTE,
            expiresAt: computeExpiryDate(),
          },
        });
        created += 1;
      } else {
        skippedNoPointsNew += 1;
        created += 1;
      }
    }
  }

  console.log(JSON.stringify({ totalRows: rows.length, createdNew: created, mergedIntoExisting, newWithZeroPoints: skippedNoPointsNew }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
