import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
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

    const cleanMin = contract_value_min ? Number(String(contract_value_min).replace(/,/g, "")) : 0;
    const cleanMax = contract_value_max ? Number(String(contract_value_max).replace(/,/g, "")) : 0;
    const password_hash = await bcrypt.hash(password, 12);

    const existing = await db.subscribers.findOne((s) => s.email === email);
    let subscriberId: number;

    if (existing) {
      subscriberId = existing.id;
      await db.subscribers.update((s) => s.id === subscriberId, {
        first_name, last_name, phone, company_name,
        cipc_number: cipc_number || "", csd_number: csd_number || "",
        bbbee_level: bbbee_level || "", years_in_operation: years_in_operation ? Number(years_in_operation) : 0,
        cidb_grade: cidb_grade ? Number(cidb_grade) : 0,
        cidb_classes: JSON.stringify(cidb_classes || []),
        provinces: JSON.stringify(provinces || []),
        sectors: JSON.stringify(sectors || []),
        contract_value_min: cleanMin, contract_value_max: cleanMax,
        tender_types: JSON.stringify(tender_types || []),
        tier: plan || "scout", status: "pending", password_hash,
      });
    } else {
      const subscriber = await db.subscribers.insert({
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
      subscriberId = subscriber.id;
    }

    const { url } = buildPayFastParams({ email, first_name, last_name }, plan || "scout", subscriberId);
    return NextResponse.json({ redirect_url: url });
  } catch (err) {
    console.error("Payment initiate error:", err);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
