import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get("Authorization");

  try {
    const res = await fetch(
      `https://morgendagens.project-ice.dk/api/user/${id}`,
      { headers: { Authorization: authHeader ?? "" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch user" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("User proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
