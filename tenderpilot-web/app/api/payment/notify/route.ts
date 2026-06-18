import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyITN } from "@/lib/payfast";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const params: Record<string, string> = {};
    text.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      params[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
    });

    const valid = verifyITN(params);
    if (!valid && process.env.PAYFAST_SANDBOX !== "true") {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const subscriberId = Number(params.custom_int1);
    const tier = params.custom_str1;
    const paymentStatus = params.payment_status;
    const payfastToken = params.token || "";

    if (paymentStatus === "COMPLETE" && subscriberId) {
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      db.subscribers.update((s) => s.id === subscriberId, {
        status: "active",
        tier: tier || "scout",
        payfast_token: payfastToken,
        subscription_start: today,
        subscription_end: nextMonth.toISOString().split("T")[0],
        onboarding_complete: 1,
      });

      const subscriber = db.subscribers.findOne((s) => s.id === subscriberId);
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
