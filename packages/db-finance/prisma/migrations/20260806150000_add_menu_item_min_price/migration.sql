-- Per-item minimum override price (e.g. staff fee can go up but never below 1000)
ALTER TABLE "catering_menu_items" ADD COLUMN "minPrice" DOUBLE PRECISION;

-- Set the two floors the user specified, and bump out-of-Bangkok travel to its new base price
UPDATE "catering_menu_items" SET "unitPrice" = 1000, "minPrice" = 1000 WHERE "name" = 'ค่าพนักงาน';
UPDATE "catering_menu_items" SET "unitPrice" = 3500, "minPrice" = 3500 WHERE "name" = 'ค่าเดินทาง นอกกรุงเทพ';
