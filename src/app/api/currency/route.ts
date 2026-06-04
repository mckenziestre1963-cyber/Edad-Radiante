import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const row = db
    .select()
    .from(crmSettings)
    .where(eq(crmSettings.key, "currency"))
    .get();
  return NextResponse.json({ currency: row?.value || "MXN" });
}

export async function POST(request: NextRequest) {
  let body: { currency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const currency = (body.currency || "").toUpperCase();
  if (!currency) {
    return NextResponse.json({ error: "Moneda requerida" }, { status: 400 });
  }

  db.insert(crmSettings)
    .values({ key: "currency", value: currency })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value: currency } })
    .run();

  return NextResponse.json({ success: true, currency });
}
