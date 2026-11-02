import { NextResponse, type NextRequest } from "next/server";

/**
 * The welcome screen works like a disclaimer: every fresh load of the app
 * (opening a shared link, reloading, typing a URL) starts there, then
 * Continue goes on to the page that was asked for.
 *
 * A fresh load is the browser fetching a whole document (`Sec-Fetch-Dest:
 * document`). Moving around inside the app uses Next's client-side
 * navigation and prefetching, which are background fetches, so those pass
 * straight through and the welcome isn't shown again. Clients that don't
 * send the header at all (old browsers, link previews) get the welcome too.
 */
export function middleware(request: NextRequest) {
  const dest = request.headers.get("sec-fetch-dest");
  const freshLoad = request.method === "GET" && (dest === "document" || dest === null);
  if (!freshLoad) return NextResponse.next();

  const welcome = new URL("/", request.url);
  welcome.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(welcome);
}

export const config = {
  matcher: ["/home", "/properties", "/properties/:path*", "/messages"],
};
