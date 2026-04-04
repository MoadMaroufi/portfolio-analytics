import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!backendUrl) {
    return NextResponse.json(
      { detail: "Server misconfiguration: missing backend API URL." },
      { status: 500 }
    );
  }
  if (!apiKey) {
    return NextResponse.json(
      { detail: "Server misconfiguration: missing backend API key." },
      { status: 500 }
    );
  }

  const body = await req.text();
  const res = await fetch(`${backendUrl}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body,
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({ detail: "Upstream error." }));
  return NextResponse.json(payload, { status: res.status });
}
