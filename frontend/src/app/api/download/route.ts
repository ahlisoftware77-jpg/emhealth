import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
  const backendUrl = `${apiBase}/storage/download/${encodeURIComponent(filename)}`;

  try {
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: `Backend returned ${response.status}` }, { status: response.status });
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });

  } catch (error: any) {
    console.error("Next.js Proxy Download Error:", error);
    return NextResponse.json({ error: "Failed to fetch from backend: " + error.message }, { status: 500 });
  }
}
