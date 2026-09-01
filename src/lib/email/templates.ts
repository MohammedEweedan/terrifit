import { formatMoney } from "@/lib/shop/money";
import type { Locale } from "@/i18n/config";

/**
 * The emails we send.
 *
 * Plain text first, because that is what lands in the inbox that matters and
 * what a screen reader gets. The HTML is a light wrapper over the same words —
 * no images, no tracking pixel, no three-column layout that breaks in Outlook.
 */

const wrap = (title: string, body: string) => `<!doctype html>
<html><body style="margin:0;background:#f5f2ec;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#121212">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px">
    <p style="font-size:12px;font-weight:900;letter-spacing:3px;color:#e8480f;margin:0 0 28px">TERRIFIT</p>
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 20px">${title}</h1>
    ${body}
  </div>
</body></html>`;

export function orderReceipt(order: {
  number: string;
  name: string;
  locale: Locale;
  lines: Array<{ title: string; variant: string | null; quantity: number; unitCents: number }>;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shipsTo: string | null;
}) {
  const money = (cents: number) => formatMoney(cents, order.locale);
  const rows = order.lines
    .map((line) => `${line.quantity} × ${line.title}${line.variant ? ` · ${line.variant}` : ""} — ${money(line.unitCents * line.quantity)}`)
    .join("\n");

  const text = [
    `Thanks ${order.name.split(" ")[0]} — we've got your order.`,
    "",
    `Order ${order.number}`,
    "",
    rows,
    "",
    `Subtotal  ${money(order.subtotalCents)}`,
    `Delivery  ${order.shippingCents === 0 ? "Free" : money(order.shippingCents)}`,
    `Tax       ${money(order.taxCents)}`,
    `Total     ${money(order.totalCents)}`,
    "",
    order.shipsTo ? `Going to: ${order.shipsTo}` : "",
    "",
    "We'll email again the moment it ships. Reply to this if anything looks wrong.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrap(
    "We've got your order",
    `<p style="margin:0 0 8px;color:#5c5851">Order <strong style="color:#121212">${order.number}</strong></p>
     <table style="width:100%;border-collapse:collapse;margin:24px 0">
       ${order.lines
         .map(
           (line) => `<tr>
             <td style="padding:10px 0;border-bottom:1px solid #e4ded5">${line.quantity} × ${line.title}${line.variant ? ` · ${line.variant}` : ""}</td>
             <td style="padding:10px 0;border-bottom:1px solid #e4ded5;text-align:right;font-weight:700">${money(line.unitCents * line.quantity)}</td>
           </tr>`,
         )
         .join("")}
       <tr><td style="padding:14px 0 4px;color:#5c5851">Subtotal</td><td style="padding:14px 0 4px;text-align:right">${money(order.subtotalCents)}</td></tr>
       <tr><td style="padding:4px 0;color:#5c5851">Delivery</td><td style="padding:4px 0;text-align:right">${order.shippingCents === 0 ? "Free" : money(order.shippingCents)}</td></tr>
       <tr><td style="padding:4px 0;color:#5c5851">Tax</td><td style="padding:4px 0;text-align:right">${money(order.taxCents)}</td></tr>
       <tr><td style="padding:12px 0;font-weight:900;font-size:18px">Total</td><td style="padding:12px 0;text-align:right;font-weight:900;font-size:18px">${money(order.totalCents)}</td></tr>
     </table>
     ${order.shipsTo ? `<p style="margin:0 0 20px;color:#5c5851">Going to: ${order.shipsTo}</p>` : ""}
     <p style="margin:0;color:#5c5851">We'll email again the moment it ships. Reply to this if anything looks wrong.</p>`,
  );

  return { subject: `Your Terrifit order ${order.number}`, text, html };
}

export function passwordReset(link: string, minutes: number) {
  const text = [
    "Someone asked to reset the password on your Terrifit account.",
    "",
    "Open this link to set a new one:",
    link,
    "",
    `It works once and expires in ${minutes} minutes.`,
    "",
    "If this wasn't you, ignore this email — nothing has changed, and whoever asked cannot get in without this link.",
  ].join("\n");

  const html = wrap(
    "Reset your password",
    `<p style="margin:0 0 24px;color:#5c5851">Someone asked to reset the password on your Terrifit account.</p>
     <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#e8480f;color:#fff;text-decoration:none;font-weight:900;letter-spacing:1px;font-size:13px;text-transform:uppercase;padding:16px 28px;border-radius:28px">Set a new password</a></p>
     <p style="margin:0 0 12px;color:#5c5851;font-size:14px">It works once and expires in ${minutes} minutes.</p>
     <p style="margin:0;color:#5c5851;font-size:14px">If this wasn't you, ignore this email — nothing has changed, and whoever asked cannot get in without this link.</p>`,
  );

  return { subject: "Reset your Terrifit password", text, html };
}
