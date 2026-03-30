import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch("https://morgendagens.project-ice.dk/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Auth proxy error", e);
    const isTimeout = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "Backend timeout" : "Internal server error" },
      { status: 504 }
    );
  }
}
