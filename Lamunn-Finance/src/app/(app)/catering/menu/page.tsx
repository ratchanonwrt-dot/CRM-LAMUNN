import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import MenuItemsManager from "@/components/catering/MenuItemsManager";
import MinimumOrderForm from "@/components/catering/MinimumOrderForm";

export default async function CateringMenuPage() {
  await requireSectionPage("CATERING");

  const [items, settingRows] = await Promise.all([
    prisma.cateringMenuItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.setting.findMany({ where: { key: { in: ["cateringMinWithBooth", "cateringMinNoBooth"] } } }),
  ]);
  const settingMap = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">จัดการเมนู / ราคา Catering</h1>
        <p className="mt-1 text-sm text-gray-500">
          แก้ไขได้ทุกอย่างที่นี่ — ชื่อรายการ หน่วย ราคา เปิด/ปิดใช้งาน รายการที่ใช้งานอยู่จะไปโผล่เป็นตัวเลือกติ๊กตอนเพิ่มรายการในหน้างานจัดเลี้ยงแต่ละงาน
        </p>
      </div>

      <MinimumOrderForm
        minWithBooth={Number(settingMap.cateringMinWithBooth ?? 10000)}
        minNoBooth={Number(settingMap.cateringMinNoBooth ?? 6000)}
      />

      <MenuItemsManager items={items} />
    </div>
  );
}
