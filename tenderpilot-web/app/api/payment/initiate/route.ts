import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { buildPayFastParams } from "@/lib/payfast";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, first_name, last_name, phone, company_name, cipc_number, csd_number,
      bbbee_level, years_in_operation, cidb_grade, cidb_classes, provinces, sectors,
      contract_value_min, contract_value_max, tender_types, plan } = body;

    if (!email || !password || !first_name || !last_name || !company_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();

    // Upsert subscriber
    const existing = db.prepare("SELECT id FROM subscribers WHERE email = ?").get(email) as { id: number } | undefined;
    let subscriberId: number;

    const cleanMin = contract_value_min ? Number(String(contract_value_min).replace(/,/g, "")) : null;
    const cleanMax = contract_value_max ? Number(String(contract_value_max).replace(/,/g, "")) : null;
    const password_hash = await bcrypt.hash(password, 12);

    if (existing) {
      subscriberId = existing.id;
      db.prepare(`
        UPDATE subscribers SET first_name=?, last_name=?, phone=?, company_name=?, cipc_number=?,
        csd_number=?, bbbee_level=?, years_in_operation=?, cidb_grade=?, cidb_classes=?, provinces=?,
        sectors=?, contract_value_min=?, contract_value_max=?, tender_types=?, tier=?, status='pending',
        password_hash=?
        WHERE id=?
      `).run(
        first_name, last_name, phone, company_name, cipc_number || null, csd_number || null,
        bbbee_level || null, years_in_operation ? Number(years_in_operation) : null,
        cidb_grade ? Number(cidb_grade) : null,
        JSON.stringify(cidb_classes || []), JSON.stringify(provinces || []),
        JSON.stringify(sectors || []), cleanMin, cleanMax,
        JSON.stringify(tender_types || []), plan || "scout", password_hash, subscriberId
      );
    } else {
      const result = db.prepare(`
        INSERT INTO subscribers (email, password_hash, first_name, last_name, phone, company_name,
          cipc_number, csd_number, bbbee_level, years_in_operation, cidb_grade, cidb_classes,
          provinces, sectors, contract_value_min, contract_value_max, tender_types, tier, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        email, password_hash, first_name, last_name, phone, company_name,
        cipc_number || null, csd_number || null, bbbee_level || null,
        years_in_operation ? Number(years_in_operation) : null,
        cidb_grade ? Number(cidb_grade) : null,
        JSON.stringify(cidb_classes || []), JSON.stringify(provinces || []),
        JSON.stringify(sectors || []), cleanMin, cleanMax,
        JSON.stringify(tender_types || []), plan || "scout"
      );
      subscriberId = Number(result.lastInsertRowid);
    }

    const { url } = buildPayFastParams({ email, first_name, last_name }, plan || "scout", subscriberId);
    return NextResponse.json({ redirect_url: url });
  } catch (err) {
    console.error("Payment initiate error:", err);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
