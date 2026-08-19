import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runBostaPickupAutomation } from "@/lib/bosta-pickup-automation";

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim() ?? "";
  const received = request.headers.get("authorization") ?? "";
  if (!expected || !secureEqual(received, `Bearer ${expected}`)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await runBostaPickupAutomation();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[Bosta pickup cron]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Bosta pickup automation failed.",
      },
      { status: 500 },
    );
  }
}
