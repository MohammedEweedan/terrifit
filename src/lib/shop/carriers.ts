/**
 * Where a tracking number goes.
 *
 * Held here rather than as a URL stored per order, because a carrier changing
 * its tracking URL then means editing one line instead of every historical
 * order — and because a URL typed into an admin field is a URL somebody can
 * typo into a phishing page.
 */
import { universalTrackingUrl } from "./seventeentrack";

export type Carrier = {
  key: string;
  name: string;
  /** `{n}` is replaced with the tracking number, URL-encoded. */
  url: string;
};

export const CARRIERS: Carrier[] = [
  { key: "royal-mail", name: "Royal Mail", url: "https://www.royalmail.com/track-your-item#/tracking-results/{n}" },
  { key: "evri", name: "Evri", url: "https://www.evri.com/track/parcel/{n}" },
  { key: "dpd", name: "DPD", url: "https://track.dpd.co.uk/search?reference={n}" },
  { key: "yodel", name: "Yodel", url: "https://www.yodel.co.uk/track/{n}" },
  { key: "parcelforce", name: "Parcelforce", url: "https://www.parcelforce.com/track-trace?trackNumber={n}" },
  { key: "dhl", name: "DHL", url: "https://www.dhl.com/gb-en/home/tracking.html?tracking-id={n}" },
  { key: "ups", name: "UPS", url: "https://www.ups.com/track?tracknum={n}" },
  { key: "fedex", name: "FedEx", url: "https://www.fedex.com/fedextrack/?trknbr={n}" },
  { key: "usps", name: "USPS", url: "https://tools.usps.com/go/TrackConfirmAction?tLabels={n}" },
  { key: "auspost", name: "Australia Post", url: "https://auspost.com.au/mypost/track/details/{n}" },
  { key: "canada-post", name: "Canada Post", url: "https://www.canadapost-postescanada.ca/track-reperage/en#/resultList?searchFor={n}" },
  { key: "gls", name: "GLS", url: "https://gls-group.com/track?match={n}" },
  { key: "poste-italiane", name: "Poste Italiane", url: "https://www.poste.it/cerca/index.html#/risultati-spedizioni/{n}" },
  { key: "correos", name: "Correos", url: "https://www.correos.es/es/en/tools/tracker/details?tracking-number={n}" },
  { key: "la-poste", name: "La Poste", url: "https://www.laposte.fr/outils/suivre-vos-envois?code={n}" },
  { key: "deutsche-post", name: "Deutsche Post", url: "https://www.deutschepost.de/sendung/simpleQuery.html?form.sendungsnummer={n}" },
  { key: "postnl", name: "PostNL", url: "https://postnl.nl/tracktrace/?B={n}" },
];

export function findCarrier(key: string | null | undefined): Carrier | undefined {
  if (!key) return undefined;
  return CARRIERS.find((carrier) => carrier.key === key);
}

/**
 * The tracking page for an order, or null when there is nothing to link to.
 *
 * A known carrier goes to its own site: a Royal Mail number belongs on Royal
 * Mail, not inside an aggregator that adds a hop and an advert.
 *
 * Anything else falls back to 17TRACK, which identifies the carrier from the
 * number itself. That fallback exists for one specific reason: V1 units ship
 * from Shenzhen, and a China-origin parcel routinely moves through carriers
 * this list does not contain — China Post, Yanwen, 4PX, a local last-mile
 * handler nobody has heard of. Without it those orders show a tracking number
 * and nowhere to put it, which is the most common "where is my order" ticket
 * a store like this gets.
 *
 * Null only when there is no number at all. A link to a carrier's search page
 * with no number in it is worse than no link, because somebody taps it and then
 * has to find the number themselves.
 */
export function trackingUrl(carrierKey: string | null | undefined, number: string | null | undefined): string | null {
  const trimmed = number?.trim();
  if (!trimmed) return null;

  const carrier = findCarrier(carrierKey);
  if (carrier) return carrier.url.replace("{n}", encodeURIComponent(trimmed));

  return universalTrackingUrl(trimmed);
}
