import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, first_name, last_name, phone, company_name, cipc_number, csd_number,
      bbbee_level, years_in_operation, cidb_grade, cidb_classes, provinces, sectors,
      contract_value_min, contract_value_max, tender_types, plan } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = db.subscribers.findOne((s) => s.email === email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const cleanMin = contract_value_min ? Number(String(contract_value_min).replace(/,/g, "")) : 0;
    const cleanMax = contract_value_max ? Number(String(contract_value_max).replace(/,/g, "")) : 0;

    const subscriber = db.subscribers.insert({
      email, password_hash, first_name, last_name, phone, company_name,
      cipc_number: cipc_number || "", csd_number: csd_number || "",
      bbbee_level: bbbee_level || "", years_in_operation: years_in_operation ? Number(years_in_operation) : 0,
      cidb_grade: cidb_grade ? Number(cidb_grade) : 0,
      cidb_classes: JSON.stringify(cidb_classes || []),
      provinces: JSON.stringify(provinces || []),
      sectors: JSON.stringify(sectors || []),
      contract_value_min: cleanMin, contract_value_max: cleanMax,
      tender_types: JSON.stringify(tender_types || []),
      tier: plan || "scout", status: "pending",
      payfast_token: "", subscription_start: "", subscription_end: "",
      onboarding_complete: 0, created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, subscriber_id: subscriber.id });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
