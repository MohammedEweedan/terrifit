"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Admin = { id: string; email: string; name: string };

type Overview = {
  members: { total: number; newThisWeek: number; pro: number; trialing: number };
  waitlist: number;
  subscriptions: { monthly: number; yearly: number; mrrCents: number; arrCents: number };
  orders: { total: number; thisWeek: number; revenueCents: number };
  content: { posts: number; comments: number };
  devices: number;
  contact: number;
  imports: number;
};

type Member = {
  id: string; email: string; name: string; handle: string | null; role: string;
  plan: string; isAdmin: boolean; createdAt: string; posts: number; metricDays: number; bands: number;
};

type Order = {
  id: string; number: string; email: string; name: string; totalCents: number;
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

const TABS = ["Overview", "Members", "Orders", "Content", "Audit"] as const;
type Tab = (typeof TABS)[number];

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
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
}: {
  locale: string;
  admin: Admin;
  overview: Overview;
  members: Member[];
  orders: Order[];
  posts: Post[];
  audit: Entry[];
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

  async function removePost(post: Post) {
    if (!window.confirm(`Remove this post by ${post.author.name}? It cannot be undone.`)) return;
    const response = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Post removed." : "Couldn't remove that post.");
    if (response.ok) refresh();
  }

  return (
    <div className="ad">
      <header className="ad-top">
        <div>
          <span className="ad-eyebrow">Terrifit</span>
          <h1>Console</h1>
        </div>
        <div className="ad-who">
          <strong>{admin.name}</strong>
          <span>{admin.email}</span>
          <a href={`/${locale}`}>Back to site</a>
        </div>
      </header>

      <nav className="ad-tabs">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? "active" : ""}>
            {item}
          </button>
        ))}
        <button type="button" onClick={refresh} className="ad-refresh" disabled={busy}>
          {busy ? "Loading…" : "Refresh"}
        </button>
      </nav>

      {message ? <p className="ad-message">{message}</p> : null}

      {tab === "Overview" ? (
        <section className="ad-grid">
          <Stat label="Members" value={overview.members.total} note={`${overview.members.newThisWeek} joined this week`} />
          <Stat label="Pro" value={overview.members.pro} note={`${Math.round((overview.members.pro / Math.max(1, overview.members.total)) * 100)}% of members`} />
          <Stat label="On trial" value={overview.members.trialing} note="Not yet paying" />
          <Stat
            label="MRR"
            value={money(overview.subscriptions.mrrCents)}
            note={`${overview.subscriptions.monthly} monthly · ${overview.subscriptions.yearly} yearly`}
          />
          <Stat label="ARR" value={money(overview.subscriptions.arrCents)} note="MRR × 12" />
          <Stat label="Waitlist" value={overview.waitlist} note="Signed up before launch" />
          <Stat label="Orders" value={overview.orders.total} note={`${overview.orders.thisWeek} this week`} />
          <Stat label="Revenue" value={money(overview.orders.revenueCents)} note="Paid orders only" />
          <Stat label="Posts" value={overview.content.posts} note={`${overview.content.comments} comments`} />
          <Stat label="Bands paired" value={overview.devices} note="V1 registrations" />
          <Stat label="Health imports" value={overview.imports} note={`${overview.contact} contact messages`} />
        </section>
      ) : null}

      {tab === "Members" ? (
        <section>
          <input
            className="ad-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or handle"
          />
          <div className="ad-scroller">
            <table className="ad-table">
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
                      {member.isAdmin ? <em className="ad-badge">staff</em> : null}
                      <small>{member.email}</small>
                    </th>
                    <td>{member.plan}</td>
                    <td>{member.role}</td>
                    <td className="num">{member.posts}</td>
                    <td className="num">{member.metricDays}</td>
                    <td className="num">{member.bands}</td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="ad-actions">
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

      {tab === "Orders" ? (
        <section className="ad-scroller">
          <table className="ad-table">
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
                    {order.sandbox ? <em className="ad-badge">test</em> : null}
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
                  <td className="num">{money(order.totalCents)}</td>
                  <td>
                    <span className={`ad-pill ad-${order.paymentStatus}`}>{order.paymentStatus}</span>
                    <small>{order.paymentMethod}</small>
                  </td>
                  <td>{order.fulfillmentStatus}</td>
                  <td>{when(order.createdAt)}</td>
                  <td className="ad-actions">
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
          <p className="ad-note">
            Marking an order refunded records a refund somebody performed in the payment provider. It does not move
            any money on its own.
          </p>
        </section>
      ) : null}

      {tab === "Content" ? (
        <section className="ad-posts">
          {posts.length === 0 ? <p className="ad-note">Nothing posted yet.</p> : null}
          {posts.map((post) => (
            <article key={post.id} className="ad-post">
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
        <section className="ad-scroller">
          <table className="ad-table">
            <thead>
              <tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{when(entry.createdAt)}</td>
                  <td>{entry.actor.name}<small>{entry.actor.email}</small></td>
                  <td><span className="ad-pill">{entry.action}</span></td>
                  <td>{entry.target}</td>
                  <td className="ad-detail">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 ? <p className="ad-note">No administrative actions recorded yet.</p> : null}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div className="ad-stat">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString() : value}</strong>
      <small>{note}</small>
    </div>
  );
}
