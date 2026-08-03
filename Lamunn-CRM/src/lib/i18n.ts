export type Locale = "th" | "en";
export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "th";

export const translations = {
  th: {
    appTitle: "Lamunn CRM",
    appTagline: "ระบบสะสมแต้มลูกค้า สแกน QR ท้ายใบเสร็จเพื่อรับแต้ม",
    customerLoginButton: "เข้าสู่ระบบลูกค้า",

    loginTitle: "เข้าสู่ระบบลูกค้า",
    lineLoginButton: "เข้าสู่ระบบด้วย LINE",
    orDivider: "หรือ",
    phoneLabel: "เบอร์โทรศัพท์",
    otpLabel: "รหัส OTP",
    requestOtpButton: "ขอรหัส OTP",
    requestOtpLoading: "กำลังส่ง...",
    verifyOtpButton: "ยืนยันและเข้าสู่ระบบ",
    verifyOtpLoading: "กำลังยืนยัน...",
    otpInvalidError: "รหัส OTP ไม่ถูกต้องหรือหมดอายุ",
    otpRequestFailedError: "ส่ง OTP ไม่สำเร็จ",
    genericError: "เกิดข้อผิดพลาด",

    scanPhoneTitle: "สแกนสำเร็จ! กรอกเบอร์เพื่อสะสมแต้ม",
    earnPointsButton: "สะสมแต้ม",
    newCustomerTitle: "ยินดีต้อนรับลูกค้าใหม่!",
    newCustomerDesc: "เบอร์ {phone} ยังไม่เคยสมัคร กรอกข้อมูลเพิ่มอีกนิดเพื่อเปิดสมาชิก",
    nameLabel: "ชื่อ",
    signupAndEarnButton: "สมัครและสะสมแต้ม",
    processingText: "กำลังดำเนินการ...",
    earnSuccessTitle: "สะสมแต้มเรียบร้อย",
    earnSuccessSubtitle: "ของรางวัลจะมาเร็วๆนี้",
    earnedPrefix: "ได้รับ",
    fromBranch: "จากสาขา",
    totalPointsNowPrefix: "แต้มสะสมทั้งหมดตอนนี้:",
    loginToViewButton: "เข้าสู่ระบบเพื่อดูแต้ม/แลกรางวัล",
    earnFailedTitle: "สะสมแต้มไม่สำเร็จ",
    scanGenericError: "เกิดข้อผิดพลาด กรุณาลองใหม่",

    welcomeTitle: "ยินดีต้อนรับ!",
    welcomeDesc: "กรอกข้อมูลอีกนิดเพื่อเปิดใช้งานสมาชิก",
    dobLabel: "วันเกิด",
    saveFailedError: "บันทึกไม่สำเร็จ",
    savingText: "กำลังบันทึก...",
    startButton: "เริ่มใช้งาน",

    genderLabel: "เพศ",
    genderFemale: "หญิง",
    genderMale: "ชาย",
    genderLgbtq: "LGBTQ+",
    genderUnspecified: "ไม่ระบุ",
    pdpaConsentText:
      "ข้าพเจ้ายินยอมให้ Lamunn เก็บและใช้ข้อมูลส่วนบุคคลของข้าพเจ้า (ชื่อ เบอร์โทรศัพท์ วันเกิด เพศ และประวัติการซื้อ) เพื่อพัฒนาระบบการขายและบริการให้มีประสิทธิภาพมากยิ่งขึ้น ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562",
    pdpaConsentRequiredError: "กรุณายอมรับเงื่อนไขการใช้ข้อมูลก่อนสมัครสมาชิก",

    navMyPoints: "แต้มของฉัน",
    navHome: "หน้าหลัก",
    navRedeem: "แลกรางวัล",
    navHistory: "ประวัติแต้ม",
    signOut: "ออกจากระบบ",

    currentTierLabel: "ระดับปัจจุบัน",
    noTierYet: "ยังไม่ถึงระดับสมาชิก",
    pointsToNextTierPrefix: "อีก {points} แต้ม สู่ระดับ {tier}",
    maxTierReached: "คุณอยู่ในระดับสูงสุดแล้ว",
    allTiersHeading: "ระดับสมาชิกทั้งหมด",
    benefitLabel: "สิทธิประโยชน์",
    lifetimePointsLabel: "แต้มสะสมทั้งหมด",

    greetingMorning: "สวัสดีตอนเช้า",
    greetingAfternoon: "สวัสดีตอนบ่าย",
    greetingEvening: "สวัสดีตอนเย็น",
    welcomeSuffix: "ยินดีต้อนรับสู่ Lamunn",
    pointsRemainingLabel: "คะแนนคงเหลือ",
    expiresOnPrefix: "{points} แต้ม หมดอายุภายใน {date}",

    pointsUnit: "แต้ม",
    useLabel: "ใช้",
    redeemFailedError: "แลกรางวัลไม่สำเร็จ",
    outOfStock: "หมด",
    redeeming: "กำลังแลก...",
    redeemButton: "แลก",

    typeEarn: "รับแต้ม",
    typeRedeem: "แลกรางวัล",
    typeAdjust: "ปรับปรุง",
    typeVoid: "ยกเลิกรายการ",
    yourPoints: "แต้มสะสมของคุณ",
    recentHistory: "ประวัติล่าสุด",
    noTransactions: "ยังไม่มีรายการ",
    noBranch: "ไม่ระบุสาขา",

    yourPointsColon: "แต้มสะสมของคุณ:",
    noRewardsAvailable: "ยังไม่มีรางวัลให้แลกในขณะนี้",

    redeemSuccessTitle: "แลกรางวัลสำเร็จ",
    usedPrefix: "ใช้",
    statusPending: "รอพนักงานยืนยัน",
    statusCompleted: "ยืนยันแล้ว รับของได้เลย",
    statusCancelled: "ถูกยกเลิก",
    qrAlt: "QR ยืนยันการแลกรางวัล",
    showQrHint: "โชว์ QR นี้ให้พนักงานหน้าร้านสแกนเพื่อรับของรางวัล",
  },
  en: {
    appTitle: "Lamunn CRM",
    appTagline: "Customer loyalty program — scan the QR on your receipt to earn points",
    customerLoginButton: "Customer Login",

    loginTitle: "Customer Login",
    lineLoginButton: "Log in with LINE",
    orDivider: "or",
    phoneLabel: "Phone Number",
    otpLabel: "OTP Code",
    requestOtpButton: "Request OTP",
    requestOtpLoading: "Sending...",
    verifyOtpButton: "Verify & Log In",
    verifyOtpLoading: "Verifying...",
    otpInvalidError: "Invalid or expired OTP code",
    otpRequestFailedError: "Failed to send OTP",
    genericError: "Something went wrong",

    scanPhoneTitle: "Scan successful! Enter your phone number to earn points",
    earnPointsButton: "Earn Points",
    newCustomerTitle: "Welcome, new customer!",
    newCustomerDesc: "{phone} isn't registered yet. Fill in a few more details to sign up.",
    nameLabel: "Name",
    signupAndEarnButton: "Sign Up & Earn Points",
    processingText: "Processing...",
    earnSuccessTitle: "Points earned successfully",
    earnSuccessSubtitle: "Rewards are coming soon",
    earnedPrefix: "You earned",
    fromBranch: "at",
    totalPointsNowPrefix: "Your total points balance:",
    loginToViewButton: "Log in to view points / redeem rewards",
    earnFailedTitle: "Failed to earn points",
    scanGenericError: "Something went wrong, please try again",

    welcomeTitle: "Welcome!",
    welcomeDesc: "Fill in a few more details to activate your membership",
    dobLabel: "Date of Birth",
    saveFailedError: "Failed to save",
    savingText: "Saving...",
    startButton: "Get Started",

    genderLabel: "Gender",
    genderFemale: "Female",
    genderMale: "Male",
    genderLgbtq: "LGBTQ+",
    genderUnspecified: "Prefer not to say",
    pdpaConsentText:
      "I consent to Lamunn collecting and using my personal data (name, phone number, date of birth, gender, and purchase history) to improve its sales system and services, in accordance with the Personal Data Protection Act B.E. 2562.",
    pdpaConsentRequiredError: "Please accept the data usage consent before signing up",

    navMyPoints: "My Points",
    navHome: "Home",
    navRedeem: "Redeem Rewards",
    navHistory: "Points History",
    signOut: "Sign Out",

    currentTierLabel: "Current Tier",
    noTierYet: "Not yet at a membership tier",
    pointsToNextTierPrefix: "{points} pts to {tier}",
    maxTierReached: "You've reached the top tier",
    allTiersHeading: "All Membership Tiers",
    benefitLabel: "Benefit",
    lifetimePointsLabel: "Total Points Earned",

    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    welcomeSuffix: "welcome to Lamunn",
    pointsRemainingLabel: "Points remaining",
    expiresOnPrefix: "{points} pts expire by {date}",

    pointsUnit: "pts",
    useLabel: "Use",
    redeemFailedError: "Failed to redeem reward",
    outOfStock: "Out of stock",
    redeeming: "Redeeming...",
    redeemButton: "Redeem",

    typeEarn: "Earned",
    typeRedeem: "Redeemed",
    typeAdjust: "Adjustment",
    typeVoid: "Voided",
    yourPoints: "Your Points Balance",
    recentHistory: "Recent History",
    noTransactions: "No transactions yet",
    noBranch: "No branch specified",

    yourPointsColon: "Your points balance:",
    noRewardsAvailable: "No rewards available to redeem right now",

    redeemSuccessTitle: "Reward Redeemed",
    usedPrefix: "Used",
    statusPending: "Waiting for staff confirmation",
    statusCompleted: "Confirmed — ready to collect",
    statusCancelled: "Cancelled",
    qrAlt: "Redemption confirmation QR",
    showQrHint: "Show this QR to staff at the branch to collect your reward",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof (typeof translations)["th"];

export function translate(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>): string {
  let text: string = translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}
