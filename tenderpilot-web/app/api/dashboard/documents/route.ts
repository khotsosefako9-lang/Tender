import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const db = getDb();
  const docs = db.prepare(`
    SELECT * FROM subscriber_documents WHERE subscriber_id = ? ORDER BY uploaded_at DESC
  `).all(userId);

  return NextResponse.json({ documents: docs });
}
