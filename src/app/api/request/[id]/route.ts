import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get("Authorization");
  try {
    const body = await req.json();
    const res = await fetch(
      `https://morgendagens.project-ice.dk/api/request/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader ?? "" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Request PUT proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get("Authorization");

  try {
    const res = await fetch(
      `https://morgendagens.project-ice.dk/api/request/${id}`,
      { headers: { Authorization: authHeader ?? "" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch request" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Request proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
