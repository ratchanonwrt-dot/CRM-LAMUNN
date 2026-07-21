import { prisma } from "./client";

const SETTINGS_ID = "singleton";

export async function getAppSettings() {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export async function setHeroImageUrl(heroImageUrl: string | null) {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { heroImageUrl },
    create: { id: SETTINGS_ID, heroImageUrl },
  });
}
