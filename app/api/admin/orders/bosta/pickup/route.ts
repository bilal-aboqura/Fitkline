import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "جدولة استلام بوسطة التلقائية متوقفة." },
    { status: 410 },
  );
}
