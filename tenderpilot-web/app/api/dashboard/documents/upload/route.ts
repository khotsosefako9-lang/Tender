import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = Number((session.user as { id: string }).id);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("document_type") as string;
    const expiryDate = formData.get("expiry_date") as string | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: "Only PDF, JPG, and PNG files are accepted" }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    if (!documentType)
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });

    // On Vercel, file system writes are not persistent; store metadata only
    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

    await db.subscriber_documents.insert({
      subscriber_id: userId,
      document_type: documentType,
      document_name: file.name,
      file_path: `/uploads/${userId}/${file.name}`,
      expiry_date: expiryDate || null,
      is_expired: isExpired ? 1 : 0,
      uploaded_at: new Date().toISOString(),
    } as never);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
