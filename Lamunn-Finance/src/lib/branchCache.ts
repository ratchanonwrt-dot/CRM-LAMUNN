import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";

/** แคชรายชื่อสาขาและค่าตั้งค่าของสาขา
 *
 * ตาราง branches / rent_configs / credit_term_cycle_configs มีรวมกันไม่กี่สิบแถว
 * และเปลี่ยนน้อยมาก (เปิด-ปิดสาขา หรือปรับ GP% เดือนละครั้ง) แต่แทบทุกหน้าในหมวดการเงิน
 * ต้องอ่านก่อนถึงจะเริ่มคำนวณอะไรได้ — และ `include` ของ Prisma แตกเป็น SQL หลายตัวต่อครั้ง
 * (วัดจริง: fetchCreditTermBranches = 6 SQL statement ต่อการเรียก 1 ครั้ง)
 *
 * แคชไว้แล้วล้างเมื่อมีการแก้สาขา/ค่าเช่า/รอบวางบิล (ดู revalidateBranches)
 */

export const BRANCHES_CACHE_TAG = "branches";

/** เรียกหลังเพิ่ม/แก้/ลบสาขา หรือแก้ค่าเช่า/GP%/รอบ Credit Term เพื่อให้ทุกหน้าเห็นค่าใหม่ทันที */
export function revalidateBranches() {
  revalidateTag(BRANCHES_CACHE_TAG);
}

/** สาขาทั้งหมด (ไม่กรอง isActive — สาขาที่ปิดแล้วยังต้องเห็นยอดย้อนหลัง) */
export const getAllBranches = unstable_cache(
  async () => prisma.branch.findMany({ orderBy: { sortOrder: "asc" } }),
  ["branches-all"],
  { tags: [BRANCHES_CACHE_TAG] }
);

/** เฉพาะ id/ชื่อ/ประเภท — ใช้ในหน้าที่ต้องการแค่ map ชื่อสาขา */
export const getBranchesLite = unstable_cache(
  async () => prisma.branch.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, type: true, isActive: true } }),
  ["branches-lite"],
  { tags: [BRANCHES_CACHE_TAG] }
);

/** สาขาเงินสด — ใช้คำนวณเงินสดคงเหลือ */
export const getCashBranchIds = unstable_cache(
  async () => (await prisma.branch.findMany({ where: { type: "CASH" }, select: { id: true } })).map((b) => b.id),
  ["branches-cash-ids"],
  { tags: [BRANCHES_CACHE_TAG] }
);

/** สาขา Credit Term พร้อม config ทั้งสองชุด — ตัวที่แพงที่สุด (6 SQL ต่อครั้งถ้าไม่แคช) */
export const getCreditTermBranchesCached = unstable_cache(
  async () =>
    prisma.branch.findMany({
      where: { type: "CREDIT_TERM" },
      orderBy: { sortOrder: "asc" },
      include: { creditTermConfig: true, rentConfig: true },
    }),
  ["branches-credit-term"],
  { tags: [BRANCHES_CACHE_TAG] }
);
