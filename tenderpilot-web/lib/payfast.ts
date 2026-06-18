import crypto from "crypto";

export const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === "true";
export const PAYFAST_URL = PAYFAST_SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

export const PLAN_PRICES: Record<string, { amount: string; label: string }> = {
  scout: { amount: "399.00", label: "Scout" },
  bid: { amount: "999.99", label: "Bid" },
  pro: { amount: "1999.99", label: "Pro" },
};

function buildSignatureString(params: Record<string, string>, passphrase: string): string {
  const ordered = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  const str = Object.entries(ordered)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`)
    .join("&");
  return passphrase ? `${str}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}` : str;
}

export function generatePayFastSignature(params: Record<string, string>): string {
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const sigString = buildSignatureString(params, passphrase);
  return crypto.createHash("md5").update(sigString).digest("hex");
}

export function buildPayFastParams(
  subscriber: { email: string; first_name: string; last_name: string },
  tier: string,
  subscriberId: number
): { url: string; params: Record<string, string> } {
  const plan = PLAN_PRICES[tier] || PLAN_PRICES.scout;
  const today = new Date().toISOString().split("T")[0];
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const params: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID || "10000100",
    merchant_key: process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a",
    return_url: `${baseUrl}/api/payment/return?subscriber_id=${subscriberId}`,
    cancel_url: `${baseUrl}/api/payment/cancel`,
    notify_url: `${baseUrl}/api/payment/notify`,
    email_address: subscriber.email,
    name_first: subscriber.first_name,
    name_last: subscriber.last_name,
    amount: plan.amount,
    item_name: `Tenderpilot ${plan.label} Subscription`,
    subscription_type: "1",
    billing_date: today,
    recurring_amount: plan.amount,
    frequency: "3",
    cycles: "0",
    custom_int1: String(subscriberId),
    custom_str1: tier,
  };

  params.signature = generatePayFastSignature(params);

  const url =
    PAYFAST_URL +
    "?" +
    Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

  return { url, params };
}

export function verifyITN(data: Record<string, string>): boolean {
  const received = data.signature;
  const { signature: _sig, ...rest } = data;
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const expected = crypto
    .createHash("md5")
    .update(buildSignatureString(rest, passphrase))
    .digest("hex");
  return received === expected;
}
