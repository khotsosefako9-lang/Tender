import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = session.user as { id: string; tier: string };
  if (user.tier !== "pro") {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const awards = (await db.tender_awards.findAll())
    .sort((a, b) => String(b.award_date || "").localeCompare(String(a.award_date || "")))
    .slice(0, 20);

  return NextResponse.json({ awards });
}
