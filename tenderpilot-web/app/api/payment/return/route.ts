import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subscriberId = Number(searchParams.get("subscriber_id"));

  let name = "";
  let tier = "scout";
  if (subscriberId) {
    const subscriber = await db.subscribers.findOne((s) => s.id === subscriberId);
    if (subscriber) { name = subscriber.first_name; tier = subscriber.tier; }
  }

  return NextResponse.redirect(new URL(`/welcome?name=${encodeURIComponent(name)}&tier=${tier}`, req.url));
}
