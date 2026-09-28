import { NextRequest, NextResponse } from "next/server";

const TARGET_BASE = process.env.BACKEND_INTERNAL_URL || "https://core.gis.terralium.tech/api/v1";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path ? path.join("/") : "";
    const targetUrl = new URL(`${TARGET_BASE}/${pathStr}`);

    req.nextUrl.searchParams.forEach((val, key) => {
      targetUrl.searchParams.append(key, val);
    });

    const headers = new Headers();
    req.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, val);
      }
    });

    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.blob()
        : undefined;

    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await res.arrayBuffer();
    const responseHeaders = new Headers();
    res.headers.forEach((val, key) => {
      if (
        key.toLowerCase() !== "content-encoding" &&
        key.toLowerCase() !== "content-length"
      ) {
        responseHeaders.set(key, val);
      }
    });

    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROXY_ERROR",
          message: err.message || "Gagal menghubungi backend.",
        },
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
