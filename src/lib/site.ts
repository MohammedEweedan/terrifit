import { personaHosts, personaSubdomains, type Persona } from "@/i18n/config";

/** Subdomains that are not persona sites but still front part of this app. */
const OTHER_SUBDOMAINS = ["shop"];

/**
 * Builds a link to a sibling site from whatever host is currently serving.
 *
 * Works unchanged across `creator.localhost:3111`, a preview domain and
 * production, because the base domain is derived by stripping a known persona
 * subdomain rather than being hardcoded.
 */
export function siteUrl(host: string, target: Persona | "main" | "shop", locale: string): string {
  const [hostname, port] = host.split(":");
  const parts = hostname.split(".");
  const known = Boolean(personaSubdomains[parts[0]]) || OTHER_SUBDOMAINS.includes(parts[0]);
  const base = known ? parts.slice(1).join(".") || hostname : hostname;

  const prefix = target === "main" ? "" : `${target === "shop" ? "shop" : personaHosts[target]}.`;
  const portSuffix = port ? `:${port}` : "";

  return `//${prefix}${base}${portSuffix}/${locale}`;
}

/** True when this host is serving the storefront at its own root. */
export function isShopHost(host: string): boolean {
  return host.split(":")[0].split(".")[0] === "shop";
}

/** Which persona site, if any, a host is serving. */
export function personaForHost(host: string): Persona | null {
  const subdomain = host.split(":")[0].split(".")[0];
  return personaSubdomains[subdomain] ?? null;
}
