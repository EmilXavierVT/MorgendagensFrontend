import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  try {
    const res = await fetch("https://morgendagens.project-ice.dk/api/request/all", {
      headers: { Authorization: authHeader ?? "" },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Get all requests proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  try {
    const body = await req.json();
    const res = await fetch("https://morgendagens.project-ice.dk/api/request/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader ?? "",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Create request proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
