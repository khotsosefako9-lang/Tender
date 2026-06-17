import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import path from "path";
import fs from "fs/promises";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("document_type") as string;
    const expiryDate = formData.get("expiry_date") as string | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Only PDF, JPG, and PNG files are accepted" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    if (!documentType) return NextResponse.json({ error: "Document type is required" }, { status: 400 });

    const uploadDir = path.join(process.cwd(), "public/uploads", userId);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "bin";
    const filename = `${documentType.replace(/\s+/g, "_")}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const db = getDb();
    const now = new Date();
    const isExpired = expiryDate ? new Date(expiryDate) < now : 0;

    db.prepare(`
      INSERT INTO subscriber_documents (subscriber_id, document_type, document_name, file_path, expiry_date, is_expired)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, documentType, file.name, `/uploads/${userId}/${filename}`, expiryDate || null, isExpired ? 1 : 0);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
