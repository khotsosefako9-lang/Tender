import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const subscribers = db.prepare(`
    SELECT id, email, first_name, last_name, company_name, tier, cidb_grade, status, created_at
    FROM subscribers ORDER BY created_at DESC
  `).all();

  return NextResponse.json({ subscribers });
}
