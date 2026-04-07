import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  try {
    const body = await req.json();
    const res = await fetch("https://morgendagens.project-ice.dk/api/product-in-requests/", {
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
    console.error("Product-in-request proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
