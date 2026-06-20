import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = Number((session.user as { id: string }).id);
  const docs = (await db.subscriber_documents.findAll((d) => d.subscriber_id === userId))
    .sort((a, b) => new Date(b.uploaded_at as string).getTime() - new Date(a.uploaded_at as string).getTime());

  return NextResponse.json({ documents: docs });
}
