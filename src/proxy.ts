import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  locales,
  personaSubdomains,
  resolveLocale,
} from "@/i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    // A printed report has no locale of its own: it is a snapshot of one
    // person's data reached by a single-use link, and prefixing it would break
    // the link the app just handed out.
    pathname.startsWith("/report/") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Persona sites are subdomains over the same app: creator., coach., nutri.,
  // sup. Each maps to a route that also stays reachable on the main host.
  const host = request.headers.get("host") ?? "";
  const subdomain = host.split(":")[0].split(".")[0];
  const persona = personaSubdomains[subdomain] ?? null;
  const isShopHost = subdomain === "shop";

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale) {
    // An explicit choice from the switcher outranks the browser's header.
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : resolveLocale(request.headers.get("accept-language")) || defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    // Preserves ?ref= so an invite link survives the locale redirect.
    return NextResponse.redirect(url);
  }

  // shop.terrifit.com serves the storefront at the root of its own host. Unlike
  // the persona sites, the whole section is rewritten rather than just the
  // landing page: a store is a section, so /cart and /checkout have to work on
  // the subdomain too. The same pages stay reachable at terrifit.com/shop/... —
  // one set of routes, two hosts.
  if (isShopHost) {
    const [, locale, ...rest] = pathname.split("/");
    const tail = rest.filter(Boolean);
    if (tail[0] !== "shop") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/shop${tail.length > 0 ? `/${tail.join("/")}` : ""}`;
      return NextResponse.rewrite(url);
    }
  }

  if (persona) {
    const [, locale, ...rest] = pathname.split("/");
    // Only the persona site's landing page is rewritten; deeper paths are
    // left alone so shared routes keep working on every host.
    if (rest.length === 0 || rest[0] === "") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/for/${persona}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
