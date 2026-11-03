import { NextResponse, NextRequest } from "next/server";

function getBackendBaseUrl(): string {
  const rawUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return rawUrl.replace(/\/api\/?$/, "");
}

/**
 * Next.js 16 Proxy entrypoint for routing `/api/*` calls to FastAPI backend.
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const backendBase = getBackendBaseUrl();
    const targetUrl = `${backendBase}${pathname}${search}`;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-forwarded-host", request.headers.get("host") || "");

    try {
      const hasBody = !["GET", "HEAD"].includes(request.method);
      const body = hasBody ? await request.arrayBuffer() : undefined;

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: requestHeaders,
        body,
        redirect: "manual",
      });

      const responseHeaders = new Headers(response.headers);
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Proxy routing error:", error);
      return NextResponse.json(
        { detail: "Backend API gateway service is temporarily unavailable" },
        { status: 503 }
      );
    }
  }

  return NextResponse.next();
}

export { proxy };

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/dashboard/:path*",
  ],
};
