import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const authHeader = req.headers.get("Authorization");

  try {
    const res = await fetch(
      `https://morgendagens.project-ice.dk/api/request/user/${userId}`,
      { headers: { Authorization: authHeader ?? "" } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Request user proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
