import { NextResponse } from "next/server";

export async function GET() {
  try {
    const loginRes = await fetch("https://morgendagens.project-ice.dk/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "emilxavierthorsen@gmail.com", password: "1234" }),
      signal: AbortSignal.timeout(8000),
    });

    console.log("[products] login status:", loginRes.status);
    if (!loginRes.ok) {
      const body = await loginRes.text();
      console.error("[products] login error body:", body);
      return NextResponse.json({ error: "Login failed", detail: body }, { status: loginRes.status });
    }

    const loginData = await loginRes.json();
    console.log("[products] login response keys:", Object.keys(loginData));
    const token = loginData.token ?? loginData.accessToken ?? loginData.access_token;

    const productsRes = await fetch("https://morgendagens.project-ice.dk/api/product/all", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    console.log("[products] products status:", productsRes.status);
    if (!productsRes.ok) {
      const body = await productsRes.text();
      console.error("[products] products error body:", body);
      return NextResponse.json({ error: "Failed to fetch products", detail: body }, { status: productsRes.status });
    }

    const data = await productsRes.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Products proxy error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
