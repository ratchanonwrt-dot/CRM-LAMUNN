const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db-finance"],
  // @lamunn/db-finance's Prisma client is generated to a non-default name
  // (node_modules/.prisma/client-finance, to avoid colliding with @lamunn/db's
  // client at node_modules/@prisma/client). Next.js only auto-traces the
  // query engine binary for the conventional "@prisma/client" package name,
  // so a differently-named client needs to be force-included explicitly.
  experimental: {
    // client router cache: เก็บ RSC ของหน้าที่เพิ่งเปิดไว้ 60 วิ (ค่าเริ่มต้น 30) — กดกลับไปหน้าที่เพิ่งดู
    // ภายในช่วงนี้ขึ้นทันทีไม่ต้องรอเซิร์ฟเวอร์ ส่วนการบันทึกทุกจุดเรียก router.refresh() ซึ่งล้าง cache นี้
    // ทั้งหมดอยู่แล้ว ตัวเลขหลังกรอกจึงไม่มีทางค้างเก่า
    staleTimes: { dynamic: 60 },
    outputFileTracingRoot: path.join(__dirname, ".."),
    outputFileTracingIncludes: {
      // Prisma bakes an absolute build-time path into the generated client as a fallback
      // search location, which is stale at runtime on Vercel (build cwd /vercel/path0 vs
      // runtime cwd /var/task/<rootDirectory>). Prisma's engine-locator also always tries
      // "<app>/node_modules/.prisma/client-finance" automatically — scripts/copy-prisma-engine.js
      // (run via the "prebuild" script) copies the generated client there, so we just need
      // Next.js to bundle that copy into the deployed function.
      "/**": [
        "../packages/db-finance/node_modules/.prisma/client-finance/**",
        "./node_modules/.prisma/client-finance/**",
        // ฟอนต์ไทยสำหรับ export PDF วางบิล (@react-pdf/renderer โหลดจาก fs ตรงๆ ไม่ได้ผ่าน import
        // ปกติ Next เลย trace ไม่เห็นถ้าไม่บอกไว้ตรงนี้)
        "./src/fonts/**",
      ],
    },
    // binaryTargets มีทั้ง "native" (Windows, ไว้ dev เครื่อง local) และ "rhel-openssl-3.0.x" (runtime จริงบน
    // Vercel) — outputFileTracingIncludes ข้างบน glob ทั้งโฟลเดอร์เลยดึง engine binary ของ Windows (~19MB)
    // ติดไปด้วยทุกครั้งทั้งที่ Linux ใช้ไม่ได้ ทำให้ deployed function ใหญ่เกือบเท่าตัวโดยเปล่าประโยชน์ —
    // งานนี้อาจเป็นส่วนหนึ่งที่ทำให้ cold start ช้า จึงตัดออกทุก route ไปเลย
    outputFileTracingExcludes: {
      "/**": [
        "../packages/db-finance/node_modules/.prisma/client-finance/query_engine-windows.dll.node",
        "./node_modules/.prisma/client-finance/query_engine-windows.dll.node",
      ],
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
