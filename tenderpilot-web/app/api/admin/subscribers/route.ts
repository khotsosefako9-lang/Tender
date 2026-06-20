import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subscribers = (await db.subscribers.findAll())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ password_hash: _, ...s }) => s);

  return NextResponse.json({ subscribers });
}
