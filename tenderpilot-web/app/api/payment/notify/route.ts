import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyITN } from "@/lib/payfast";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const params: Record<string, string> = {};
    text.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
    });

    const valid = verifyITN(params);
    if (!valid && process.env.PAYFAST_SANDBOX !== "true") {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const subscriberId = params.custom_int1;
    const tier = params.custom_str1;
    const paymentStatus = params.payment_status;
    const payfastToken = params.token || null;

    if (paymentStatus === "COMPLETE" && subscriberId) {
      const db = getDb();
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      db.prepare(`
        UPDATE subscribers
        SET status = 'active', tier = ?, payfast_token = ?,
            subscription_start = ?, subscription_end = ?, onboarding_complete = 1
        WHERE id = ?
      `).run(tier || "scout", payfastToken, today, nextMonth.toISOString().split("T")[0], subscriberId);

      const subscriber = db.prepare("SELECT * FROM subscribers WHERE id = ?").get(subscriberId) as {
        email: string; first_name: string; tier: string;
      } | undefined;
      if (subscriber) {
        await sendWelcomeEmail(subscriber).catch(console.error);
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("ITN error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
