import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, first_name, last_name, phone, company_name, cipc_number, csd_number,
      bbbee_level, years_in_operation, cidb_grade, cidb_classes, provinces, sectors,
      contract_value_min, contract_value_max, tender_types, plan } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM subscribers WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const cleanMin = contract_value_min ? Number(String(contract_value_min).replace(/,/g, "")) : null;
    const cleanMax = contract_value_max ? Number(String(contract_value_max).replace(/,/g, "")) : null;

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
      JSON.stringify(cidb_classes || []),
      JSON.stringify(provinces || []),
      JSON.stringify(sectors || []),
      cleanMin, cleanMax,
      JSON.stringify(tender_types || []),
      plan || "scout"
    );

    return NextResponse.json({ success: true, subscriber_id: result.lastInsertRowid });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
