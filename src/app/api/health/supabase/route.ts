import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const checks = {
    supabaseAuth: false,
    postgres: false,
  };
  const errors: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    checks.supabaseAuth = true;
  } catch (error) {
    errors.supabaseAuth =
      error instanceof Error ? error.message : "Supabase auth failed";
  }

  try {
    await prisma.$queryRaw`select 1`;
    checks.postgres = true;
  } catch (error) {
    errors.postgres = error instanceof Error ? error.message : "Postgres failed";
  }

  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      ok,
      checks,
      errors,
    },
    { status: ok ? 200 : 500 },
  );
}
