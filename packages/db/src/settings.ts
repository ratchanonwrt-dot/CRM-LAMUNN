import { prisma } from "./client";
import type { Prisma } from "@prisma/client";

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

export type SiteContentInput = Pick<
  Prisma.AppSettingsUncheckedCreateInput,
  | "appName"
  | "taglineTh"
  | "taglineEn"
  | "greetingMorningTh"
  | "greetingMorningEn"
  | "greetingAfternoonTh"
  | "greetingAfternoonEn"
  | "greetingEveningTh"
  | "greetingEveningEn"
  | "navHomeTh"
  | "navHomeEn"
  | "navRedeemTh"
  | "navRedeemEn"
>;

export async function setSiteContent(data: SiteContentInput) {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
}
