import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subscriberId = searchParams.get("subscriber_id");

  let name = "";
  let tier = "scout";
  if (subscriberId) {
    const db = getDb();
    const subscriber = db.prepare("SELECT first_name, tier FROM subscribers WHERE id = ?").get(subscriberId) as
      { first_name: string; tier: string } | undefined;
    if (subscriber) { name = subscriber.first_name; tier = subscriber.tier; }
  }

  return NextResponse.redirect(new URL(`/welcome?name=${encodeURIComponent(name)}&tier=${tier}`, req.url));
}
