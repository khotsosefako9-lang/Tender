import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = session.user as { id: string; tier: string };
  if (user.tier !== "pro") {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const db = getDb();
  const subscriber = db.prepare("SELECT provinces, sectors FROM subscribers WHERE id = ?").get(user.id) as
    { provinces: string; sectors: string } | undefined;

  let awards;
  if (subscriber) {
    const provinces = JSON.parse(subscriber.provinces || "[]");
    const provinceClause = provinces.length > 0
      ? `AND (province IN (${provinces.map(() => "?").join(",")}) OR province IS NULL OR province = '')`
      : "";
    awards = db.prepare(`
      SELECT * FROM tender_awards WHERE 1=1 ${provinceClause}
      ORDER BY award_date DESC LIMIT 20
    `).all(...provinces);
  } else {
    awards = db.prepare("SELECT * FROM tender_awards ORDER BY award_date DESC LIMIT 20").all();
  }

  return NextResponse.json({ awards });
}
