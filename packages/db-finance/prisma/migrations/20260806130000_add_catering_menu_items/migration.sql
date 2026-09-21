-- CreateEnum
CREATE TYPE "CateringMenuCategory" AS ENUM ('MENU', 'SERVICE', 'SNACK_BOX');

-- CreateTable
CREATE TABLE "catering_menu_items" (
    "id" TEXT NOT NULL,
    "category" "CateringMenuCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "unitLabel" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_menu_items_pkey" PRIMARY KEY ("id")
);

-- Seed the current price list (editable afterwards from /catering/menu)
INSERT INTO "catering_menu_items" ("id", "category", "name", "unitLabel", "unitPrice", "sortOrder", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'MENU', '3 ชิ้นต่อ 1 เสิร์ฟ', NULL, 55, 0, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'MENU', '6 ชิ้นต่อ 1 เสิร์ฟ', NULL, 75, 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SERVICE', 'ค่าพนักงาน', 'ต่อ 150 เสิร์ฟ', 1000, 0, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SERVICE', 'ค่าขนย้ายบูธ', NULL, 2500, 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SERVICE', 'ค่าเดินทาง ในกรุงเทพ', NULL, 1500, 2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SERVICE', 'ค่าเดินทาง นอกกรุงเทพ', 'เริ่มต้น + ตามระยะทาง', 3000, 3, CURRENT_TIMESTAMP);

-- Booth-dependent minimum order, reusing the existing key-value Setting table
INSERT INTO "settings" ("id", "key", "value", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'cateringMinWithBooth', '10000', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cateringMinNoBooth', '6000', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
