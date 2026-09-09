"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/shop/catalog";

type Admin = { id: string; email: string; name: string };

type Overview = {
  members: { total: number; newThisWeek: number; pro: number; payingCustomers: number; trialing: number };
  waitlist: number;
  subscriptions: { monthly: number; yearly: number; mrrCents: number; arrCents: number };
  orders: { total: number; thisWeek: number; paid: number; sandbox: number; revenueCents: number };
  payments: {
    byCurrency: PaymentBucket[];
    byMethod: Array<{ method: string; orders: number; revenue: PaymentBucket[] }>;
    byStatus: Array<{ status: string; orders: number }>;
  };
  sales: {
    terrifuel: SalesMetric;
    band: SalesMetric;
    accessories: SalesMetric;
    products: Array<SalesMetric & { slug: string; name: string; category: string; brand: string }>;
  };
  content: { posts: number; comments: number };
  devices: number;
  contact: number;
  imports: number;
};

type PaymentBucket = {
  currency: string; grossCents: number; refundedCents: number; netCents: number;
  paidOrders: number; refundedOrders: number; averageOrderCents: number;
};

type SalesMetric = { units: number; orders: number; revenue: Array<{ currency: string; cents: number }> };

type Member = {
  id: string; email: string; name: string; handle: string | null; role: string;
  plan: string; isAdmin: boolean; createdAt: string; posts: number; metricDays: number; bands: number;
};

type Order = {
  id: string; number: string; email: string; name: string; totalCents: number;
  currency: string;
  paymentMethod: string; paymentStatus: string; fulfillmentStatus: string; sandbox: boolean;
  createdAt: string; address: string | null;
  items: Array<{ title: string; variantLabel: string | null; quantity: number; unitPriceCents: number }>;
};

type Post = {
  id: string; kind: string; body: string; visibility: string; likeCount: number;
  commentCount: number; createdAt: string;
  author: { id: string; name: string; handle: string | null; email: string };
};

type Entry = {
  id: string; action: string; target: string; detail: string;
  actor: { name: string; email: string }; createdAt: string;
};

type WaitlistEntry = {
  id: string; email: string; name: string; role: string; country: string;
  position: number; referrals: number; referralCode: string; referredByCode: string | null;
  features: string[]; handle: string | null; audienceSize: string | null; createdAt: string;
};
type Waitlist = {
  total: number;
  byRole: Array<{ role: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
  entries: WaitlistEntry[];
};
type Message = {
  id: string; topic: string; name: string; email: string; message: string;
  locale: string; handled: boolean; createdAt: string;
};
type Messages = { unhandled: number; messages: Message[] };

type Look = {
  id: string; title: string; note: string | null; imageUrl: string; alt: string;
  productSlugs: string[]; published: boolean; sortOrder: number;
};

const TABS = ["Overview", "Products", "Orders", "Revenue", "Members", "Waitlist", "Messages", "Lookbook", "Content", "Audit"] as const;
type Tab = (typeof TABS)[number];

/**
 * Money, in a console that must never go blank.
 *
 * `Intl.NumberFormat` throws a RangeError for an empty string, null, or
 * anything that is not a three-letter code — and a default parameter only
 * covers `undefined`, so `currency: null` on a single legacy order was enough
 * to throw during render and take the whole console down to a blank page.
 * A malformed code now degrades to the amount plus whatever was stored.
 */
const money = (cents: number, currency?: string | null) => {
  const code = (currency ?? "USD").trim().toUpperCase();
  const amount = (cents ?? 0) / 100;
  if (!/^[A-Z]{3}$/.test(code)) return `${amount.toFixed(2)} ${code || "?"}`.trim();
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
};
const salesRevenue = (metric: SalesMetric) =>
  metric.revenue.length ? metric.revenue.map((entry) => money(entry.cents, entry.currency)).join(" · ") : "No paid sales";
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/**
 * Staff console.
 *
 * Everything destructive confirms first, and everything that changes another
 * person's account writes to the audit log server-side — the UI cannot skip
 * that, because it does not do the writing.
 */
export function AdminConsole({
  locale,
  admin,
  overview,
  members,
  orders,
  posts,
  audit: entries,
  products,
  waitlist,
  messages,
  looks,
}: {
  locale: string;
  admin: Admin;
  overview: Overview;
  members: Member[];
  orders: Order[];
  posts: Post[];
  audit: Entry[];
  products: Product[];
  waitlist: Waitlist;
  messages: Messages;
  looks: Look[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [query, setQuery] = useState("");
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  // The server rendered this data; after a change it re-renders it. No effect,
  // no second copy of the truth living in component state.
  const refresh = () => startTransition(() => router.refresh());

  const shown = query
    ? members.filter((member) =>
        [member.name, member.email, member.handle ?? ""].some((field) =>
          field.toLowerCase().includes(query.toLowerCase()),
        ),
      )
    : members;


  async function patchMember(id: string, body: Record<string, unknown>, label: string) {
    setMessage("");
    const response = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(
        error?.error === "cannot_demote_self"
          ? "You cannot remove your own staff access — ask another admin."
          : `Couldn't ${label}.`,
      );
      return;
    }
    setMessage(`${label} done.`);
    refresh();
  }

  async function patchOrder(id: string, body: Record<string, unknown>) {
    setMessage("");
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(response.ok ? "Order updated." : "Couldn't update that order.");
    if (response.ok) refresh();
  }

  const [lookFile, setLookFile] = useState<File | null>(null);
  const [lookUrl, setLookUrl] = useState("");

  /**
   * Uploads the chosen image first, then creates the look with the URL it
   * returns. Two steps rather than one multipart endpoint, so a failed upload
   * never leaves a look pointing at nothing.
   */
  async function addLook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");

    let imageUrl = String(form.get("imageUrl") ?? "").trim();
    if (lookFile) {
      const upload = new FormData();
      upload.append("file", lookFile);
      const response = await fetch("/api/admin/upload", { method: "POST", body: upload });
      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string; detail?: string } | null;
      if (!response.ok || !payload?.url) {
        setMessage(payload?.detail ?? `Upload failed (${payload?.error ?? response.status}).`);
        return;
      }
      imageUrl = payload.url;
    }
    if (!imageUrl) { setMessage("Choose a file or paste an image URL."); return; }

    const response = await fetch("/api/admin/lookbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        note: form.get("note") || "",
        imageUrl,
        alt: form.get("alt"),
        productSlugs: String(form.get("productSlugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        sortOrder: Number(form.get("sortOrder") ?? 0),
      }),
    });
    setMessage(response.ok ? "Look added." : "Couldn't add that look.");
    if (response.ok) { setLookFile(null); setLookUrl(""); refresh(); }
  }

  async function patchLook(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/lookbook/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setMessage(response.ok ? "Look updated." : "Couldn't update that look.");
    if (response.ok) refresh();
  }

  async function removeLook(look: Look) {
    if (!window.confirm(`Remove "${look.title}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/admin/lookbook/${look.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Look removed." : "Couldn't remove that look.");
    if (response.ok) refresh();
  }

  async function setHandled(id: string, handled: boolean) {
    setMessage("");
    const response = await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled }),
    });
    setMessage(response.ok ? "Message updated." : "Couldn't update that message.");
    if (response.ok) refresh();
  }

  async function removePost(post: Post) {
    if (!window.confirm(`Remove this post by ${post.author.name}? It cannot be undone.`)) return;
    const response = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Post removed." : "Couldn't remove that post.");
    if (response.ok) refresh();
  }

  return (
    <div className="cnsl">
      <header className="cnsl-top">
        <div>
          <span className="cnsl-eyebrow">Terrifit</span>
          <h1>Console</h1>
        </div>
        <div className="cnsl-who">
          <strong>{admin.name}</strong>
          <span>{admin.email}</span>
          <a href={`/${locale}`}>Back to site</a>
        </div>
      </header>

      <nav className="cnsl-tabs">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? "active" : ""}>
            {item}
          </button>
        ))}
        <button type="button" onClick={refresh} className="cnsl-refresh" disabled={busy}>
          {busy ? "Loading…" : "Refresh"}
        </button>
      </nav>

      {message ? <p className="cnsl-message-body">{message}</p> : null}

      {tab === "Overview" ? (
        <section className="cnsl-grid">
          <Stat label="Members" value={overview.members.total} note={`${overview.members.newThisWeek} joined this week`} />
          <Stat label="Paying customers" value={overview.members.payingCustomers} note={`${Math.round((overview.members.payingCustomers / Math.max(1, overview.members.total)) * 100)}% of members`} />
          <Stat label="Pro access" value={overview.members.pro} note="Paid and comped accounts" />
          <Stat label="On trial" value={overview.members.trialing} note="Not yet paying" />
          <Stat
            label="MRR"
            value={money(overview.subscriptions.mrrCents)}
            note={`${overview.subscriptions.monthly} monthly · ${overview.subscriptions.yearly} yearly`}
          />
          <Stat label="ARR" value={money(overview.subscriptions.arrCents)} note="MRR × 12" />
          <Stat label="Waitlist" value={overview.waitlist} note="Signed up before launch" />
          <Stat label="Paid orders" value={overview.orders.paid} note={`${overview.orders.thisWeek} all orders this week`} />
          <Stat label="Terrifuel" value={overview.sales.terrifuel.units} note={`${overview.sales.terrifuel.orders} paid orders · ${salesRevenue(overview.sales.terrifuel)}`} />
          <Stat label="Band sales" value={overview.sales.band.units} note={`${overview.sales.band.orders} paid orders · ${salesRevenue(overview.sales.band)}`} />
          <Stat label="Accessory sales" value={overview.sales.accessories.units} note={`${overview.sales.accessories.orders} paid orders · ${salesRevenue(overview.sales.accessories)}`} />
          <Stat label="Posts" value={overview.content.posts} note={`${overview.content.comments} comments`} />
          <Stat label="Bands paired" value={overview.devices} note="V1 registrations" />
          <Stat label="Health imports" value={overview.imports} note={`${overview.contact} contact messages`} />
        </section>
      ) : null}

      {tab === "Products" ? (
        <section className="cnsl-scroller">
          <div className="cnsl-section-head">
            <div><h2>Products and stock</h2><p className="cnsl-note">Live catalogue state used by the website, app and checkout.</p></div>
          </div>
          <table className="cnsl-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Variants</th><th className="num">Stock</th><th>Sales</th></tr></thead>
            <tbody>
              {products.map((product) => {
                const stock = product.variants.length
                  ? product.variants.reduce((total, variant) => total + (variant.stockQuantity ?? 0), 0)
                  : product.stockQuantity ?? 0;
                const metric = overview.sales.products.find((item) => item.slug === product.slug);
                return <tr key={product.slug}>
                  <th scope="row">{product.name}<small>{product.brand} · {product.slug}</small></th>
                  <td>{product.category}</td>
                  <td>{money(product.priceCents)}</td>
                  <td><span className={`cnsl-pill ${product.active === false ? "cnsl-failed" : "cnsl-paid"}`}>{product.active === false ? "archived" : "active"}</span></td>
                  <td>{product.variants.map((variant) => <small key={variant.id} className="cnsl-variant">
                    <span className="cnsl-swatch" aria-hidden="true">{(variant.colours ?? []).map((colour) => <i key={colour} style={{ backgroundColor: colour }} />)}</span>
                    {variant.label} · {variant.stockQuantity ?? 0}
                  </small>)}</td>
                  <td className="num">{stock}</td>
                  <td>{metric ? `${metric.units} units` : "0 units"}<small>{metric ? salesRevenue(metric) : "No paid sales"}</small></td>
                </tr>;
              })}
            </tbody>
          </table>
          <p className="cnsl-note">Create, edit, archive, change images, colour combinations and exact variant stock in the mobile console’s Products tab.</p>
        </section>
      ) : null}

      {tab === "Members" ? (
        <section>
          <input
            className="cnsl-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or handle"
          />
          <div className="cnsl-scroller">
            <table className="cnsl-table">
              <thead>
                <tr>
                  <th>Member</th><th>Plan</th><th>Role</th><th className="num">Posts</th>
                  <th className="num">Days</th><th className="num">Bands</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((member) => (
                  <tr key={member.id}>
                    <th scope="row">
                      {member.name}
                      {member.isAdmin ? <em className="cnsl-badge">staff</em> : null}
                      <small>{member.email}</small>
                    </th>
                    <td>{member.plan}</td>
                    <td>{member.role}</td>
                    <td className="num">{member.posts}</td>
                    <td className="num">{member.metricDays}</td>
                    <td className="num">{member.bands}</td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="cnsl-actions">
                      <button
                        type="button"
                        onClick={() => void patchMember(member.id, { plan: member.plan === "pro" ? "free" : "pro" }, member.plan === "pro" ? "downgrade to free" : "upgrade to Pro")}
                      >
                        {member.plan === "pro" ? "Make free" : "Make Pro"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void patchMember(member.id, { isAdmin: !member.isAdmin }, member.isAdmin ? "revoke staff access" : "grant staff access")}
                      >
                        {member.isAdmin ? "Revoke staff" : "Make staff"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "Waitlist" ? (
        <section>
          {/* The demand signal first: who is on the list and where they are.
              Counting roles and markets in the database is cheaper and more
              honest than tallying a truncated page of rows in the browser. */}
          <div className="cnsl-cards">
            <article><h3>On the list</h3><strong className="num">{waitlist.total.toLocaleString()}</strong></article>
            {waitlist.byRole.slice(0, 4).map((row) => (
              <article key={row.role}><h3>{row.role}</h3><strong className="num">{row.count.toLocaleString()}</strong></article>
            ))}
          </div>

          <p className="cnsl-queue-note">
            Top markets: {waitlist.byCountry.map((row) => `${row.country} ${row.count}`).join(" · ") || "none yet"}
          </p>

          <input
            className="cnsl-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or referral code"
          />
          <div className="cnsl-scroller">
            <table className="cnsl-table">
              <thead>
                <tr>
                  <th className="num">#</th><th>Person</th><th>Role</th><th>Market</th>
                  <th className="num">Referrals</th><th>Code</th><th>Wants</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.entries
                  .filter((entry) => {
                    const q = query.trim().toLowerCase();
                    return !q || entry.name.toLowerCase().includes(q) || entry.email.toLowerCase().includes(q)
                      || entry.referralCode.toLowerCase().includes(q);
                  })
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td className="num">{entry.position}</td>
                      <th scope="row">{entry.name}<small>{entry.email}</small></th>
                      <td>{entry.role}{entry.handle ? <small>{entry.handle}</small> : null}</td>
                      <td>{entry.country}</td>
                      <td className="num">{entry.referrals}</td>
                      <td><code>{entry.referralCode}</code></td>
                      <td>{entry.features.join(", ") || "—"}</td>
                      <td>{when(entry.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "Lookbook" ? (
        <section>
          <form className="cnsl-look-form" onSubmit={addLook}>
            <div className="cnsl-look-row">
              <label><span>Title</span><input name="title" required maxLength={120} placeholder="Rest day" /></label>
              <label><span>Order</span><input name="sortOrder" type="number" min={0} max={999} defaultValue={0} /></label>
            </div>
            <label><span>Alt text</span><input name="alt" required maxLength={300} placeholder="What the photograph shows, for anyone who cannot see it" /></label>
            <label><span>Note</span><input name="note" maxLength={400} placeholder="Optional line under the title" /></label>
            <label><span>Products</span><input name="productSlugs" placeholder="terrifits-hoodie, terrifits-training-shorts" /></label>
            <div className="cnsl-look-row">
              <label>
                <span>Upload</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                       onChange={(event) => setLookFile(event.target.files?.[0] ?? null)} />
              </label>
              {/* Either an upload or a path already in public/media. The upload
                  wins when both are given. */}
              <label>
                <span>…or image URL</span>
                <input name="imageUrl" value={lookUrl} onChange={(event) => setLookUrl(event.target.value)}
                       placeholder="/media/hoodie-hero.png" />
              </label>
            </div>
            <button type="button" className="cnsl-refresh" onClick={(event) => (event.currentTarget.form as HTMLFormElement)?.requestSubmit()}>
              Add look
            </button>
          </form>

          <div className="cnsl-scroller">
            <table className="cnsl-table">
              <thead>
                <tr><th>Look</th><th>Products</th><th className="num">Order</th><th>State</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {looks.map((look) => (
                  <tr key={look.id} className={look.published ? undefined : "is-done"}>
                    <th scope="row">{look.title}<small>{look.alt}</small></th>
                    <td>{look.productSlugs.join(", ") || "—"}</td>
                    <td className="num">{look.sortOrder}</td>
                    <td>{look.published ? "Published" : "Draft"}</td>
                    <td>
                      <button type="button" disabled={busy} onClick={() => void patchLook(look.id, { published: !look.published })}>
                        {look.published ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => void removeLook(look)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "Messages" ? (
        <section>
          <p className="cnsl-queue-note">
            {messages.unhandled > 0
              ? `${messages.unhandled} waiting for a reply.`
              : "Everything here has been handled."}
          </p>
          <div className="cnsl-scroller">
            <table className="cnsl-table">
              <thead>
                <tr><th>From</th><th>Topic</th><th>Message</th><th>Received</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {messages.messages.map((item) => (
                  <tr key={item.id} className={item.handled ? "is-done" : undefined}>
                    <th scope="row">{item.name}<small>{item.email}</small></th>
                    <td>{item.topic}<small>{item.locale}</small></td>
                    <td className="cnsl-message-body">{item.message}</td>
                    <td>{when(item.createdAt)}</td>
                    <td>
                      <button type="button" disabled={busy} onClick={() => void setHandled(item.id, !item.handled)}>
                        {item.handled ? "Reopen" : "Mark handled"}
                      </button>
                      <a href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.topic}`)}`}>Reply</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "Orders" ? (
        <section className="cnsl-scroller">
          <table className="cnsl-table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Items</th><th className="num">Total</th>
                <th>Payment</th><th>Fulfilment</th><th>Placed</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <th scope="row">
                    {order.number}
                    {order.sandbox ? <em className="cnsl-badge">test</em> : null}
                  </th>
                  <td>
                    {order.name}
                    <small>{order.email}</small>
                    {order.address ? <small>{order.address}</small> : null}
                  </td>
                  <td>
                    {order.items.map((item) => (
                      <small key={`${item.title}-${item.variantLabel ?? ""}`}>
                        {item.quantity} × {item.title}
                        {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                      </small>
                    ))}
                  </td>
                  <td className="num">{money(order.totalCents, order.currency)}</td>
                  <td>
                    <span className={`cnsl-pill ad-${order.paymentStatus}`}>{order.paymentStatus}</span>
                    <small>{order.paymentMethod}</small>
                  </td>
                  <td>{order.fulfillmentStatus}</td>
                  <td>{when(order.createdAt)}</td>
                  <td className="cnsl-actions">
                    {order.paymentStatus !== "paid" ? (
                      <button type="button" onClick={() => void patchOrder(order.id, { paymentStatus: "paid" })}>
                        Mark paid
                      </button>
                    ) : null}
                    {order.fulfillmentStatus !== "fulfilled" ? (
                      <button type="button" onClick={() => void patchOrder(order.id, { fulfillmentStatus: "fulfilled" })}>
                        Mark shipped
                      </button>
                    ) : null}
                    {order.paymentStatus === "paid" ? (
                      <button type="button" onClick={() => void patchOrder(order.id, { paymentStatus: "refunded" })}>
                        Record refund
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cnsl-note">
            Marking an order refunded records a refund somebody performed in the payment provider. It does not move
            any money on its own.
          </p>
        </section>
      ) : null}

      {tab === "Revenue" ? (
        <section>
          <div className="cnsl-grid">
            {overview.payments.byCurrency.map((bucket) => <Stat key={bucket.currency} label={`${bucket.currency} net revenue`} value={money(bucket.netCents, bucket.currency)} note={`${money(bucket.grossCents, bucket.currency)} gross · ${money(bucket.refundedCents, bucket.currency)} refunded`} />)}
            <Stat label="MRR" value={money(overview.subscriptions.mrrCents)} note={`${overview.subscriptions.monthly} monthly · ${overview.subscriptions.yearly} yearly`} />
            <Stat label="ARR" value={money(overview.subscriptions.arrCents)} note="MRR × 12" />
          </div>
          <h2 className="cnsl-subhead">Payments by currency</h2>
          <div className="cnsl-scroller"><table className="cnsl-table"><thead><tr><th>Currency</th><th className="num">Gross</th><th className="num">Refunded</th><th className="num">Net</th><th className="num">Paid orders</th><th className="num">AOV</th></tr></thead><tbody>
            {overview.payments.byCurrency.map((bucket) => <tr key={bucket.currency}><th>{bucket.currency}</th><td className="num">{money(bucket.grossCents, bucket.currency)}</td><td className="num">{money(bucket.refundedCents, bucket.currency)}</td><td className="num">{money(bucket.netCents, bucket.currency)}</td><td className="num">{bucket.paidOrders}</td><td className="num">{money(bucket.averageOrderCents, bucket.currency)}</td></tr>)}
          </tbody></table></div>
          <h2 className="cnsl-subhead">Payment methods</h2>
          <div className="cnsl-scroller"><table className="cnsl-table"><thead><tr><th>Method</th><th className="num">Paid orders</th><th>Net revenue</th></tr></thead><tbody>
            {overview.payments.byMethod.map((method) => <tr key={method.method}><th>{method.method}</th><td className="num">{method.orders}</td><td>{method.revenue.map((bucket) => `${money(bucket.netCents, bucket.currency)} ${bucket.currency}`).join(" · ")}</td></tr>)}
          </tbody></table></div>
          <h2 className="cnsl-subhead">Products</h2>
          <div className="cnsl-scroller"><table className="cnsl-table"><thead><tr><th>Product</th><th>Business line</th><th className="num">Orders</th><th className="num">Units</th><th>Revenue</th></tr></thead><tbody>
            {overview.sales.products.map((product) => <tr key={product.slug}><th>{product.name}<small>{product.brand}</small></th><td>{product.category}</td><td className="num">{product.orders}</td><td className="num">{product.units}</td><td>{salesRevenue(product)}</td></tr>)}
          </tbody></table></div>
          <p className="cnsl-note">Test orders are excluded. Values stay in their original currency instead of being added into a misleading dollar total.</p>
        </section>
      ) : null}

      {tab === "Content" ? (
        <section className="cnsl-posts">
          {posts.length === 0 ? <p className="cnsl-note">Nothing posted yet.</p> : null}
          {posts.map((post) => (
            <article key={post.id} className="cnsl-post">
              <header>
                <strong>{post.author.name}</strong>
                <span>@{post.author.handle ?? "member"} · {post.author.email}</span>
                <em>{post.kind} · {post.visibility} · {when(post.createdAt)}</em>
              </header>
              <p>{post.body}</p>
              <footer>
                <span>{post.likeCount} likes · {post.commentCount} comments</span>
                <button type="button" onClick={() => void removePost(post)}>Remove</button>
              </footer>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "Audit" ? (
        <section className="cnsl-scroller">
          <table className="cnsl-table">
            <thead>
              <tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{when(entry.createdAt)}</td>
                  <td>{entry.actor.name}<small>{entry.actor.email}</small></td>
                  <td><span className="cnsl-pill">{entry.action}</span></td>
                  <td>{entry.target}</td>
                  <td className="cnsl-detail">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 ? <p className="cnsl-note">No administrative actions recorded yet.</p> : null}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div className="cnsl-stat">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString() : value}</strong>
      <small>{note}</small>
    </div>
  );
}
