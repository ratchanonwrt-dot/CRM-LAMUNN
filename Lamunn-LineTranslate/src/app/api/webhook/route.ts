import { verifyLineSignature, replyMessage, type LineEvent } from "@/lib/line";
import { translateForGroup } from "@/lib/translate";

export const runtime = "nodejs";

async function handleEvent(event: LineEvent): Promise<void> {
  if (event.type === "join" && event.replyToken) {
    await replyMessage(
      event.replyToken,
      "สวัสดีค่ะ 🇹🇭🇲🇲🇬🇧 บอทแปลภาษาพร้อมใช้งานแล้ว พิมพ์คุยได้ตามปกติ บอทจะแปลให้อัตโนมัติ"
    );
    return;
  }

  if (event.type !== "message" || event.message?.type !== "text" || !event.replyToken) {
    return;
  }

  const text = event.message.text ?? "";
  const translated = await translateForGroup(text);
  if (!translated) return;

  await replyMessage(event.replyToken, translated);
}

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let events: LineEvent[] = [];
  try {
    events = JSON.parse(rawBody).events ?? [];
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  await Promise.allSettled(events.map(handleEvent));

  return new Response("OK", { status: 200 });
}
