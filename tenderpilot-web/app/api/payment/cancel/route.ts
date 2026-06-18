import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/onboard?cancelled=1", req.url));
}
