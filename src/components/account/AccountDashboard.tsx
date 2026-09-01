"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";

type Tab = "profile" | "data" | "apps";

export type ProfileData = {
  name: string;
  handle: string;
  dateOfBirth: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  units: string;
  timezone: string;
  goal: string;
  activityLevel: string;
  trainingDays: string;
  bio: string;
  shareWithCreators: boolean;
};

export type ScanRow = {
  id: string;
  takenAt: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  skeletalMuscleKg: number | null;
  score: number | null;
};

export type ImportRow = {
  id: string;
  provider: string;
  filename: string | null;
  status: string;
  metricCount: number;
  scanCount: number;
  createdAt: string;
};

export type ConnectionRow = { provider: string; status: string };

export function AccountDashboard({
  locale,
  copy,
  email,
  initialProfile,
  initialScans,
  initialImports,
  initialConnections,
  metricCount,
}: {
  locale: Locale;
  copy: PagesCopy["account"]["dashboard"];
  email: string;
  initialProfile: ProfileData;
  initialScans: ScanRow[];
  initialImports: ImportRow[];
  initialConnections: ConnectionRow[];
  metricCount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState(initialProfile);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <div className="ac-dashboard">
      <div className="tf-shell">
        <header className="ac-head">
          <div>
            <p className="ac-eyebrow">{copy.eyebrow}</p>
            <h1>
              {copy.greeting}, {profile.name || email}
            </h1>
            <p className="ac-email">{email}</p>
          </div>
          <button type="button" className="ac-signout" onClick={signOut}>
            {copy.signOut}
          </button>
        </header>

        <div className="ac-tabs" role="tablist">
          {(["profile", "data", "apps"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={tab === key ? "is-active" : undefined}
              onClick={() => setTab(key)}
            >
              {copy.tabs[key]}
            </button>
          ))}
        </div>

        {tab === "profile" ? (
          <ProfilePanel copy={copy.profile} profile={profile} onChange={setProfile} />
        ) : null}
        {tab === "data" ? (
          <DataPanel
            copy={copy.import}
            scans={initialScans}
            imports={initialImports}
            metricCount={metricCount}
            locale={locale}
          />
        ) : null}
        {tab === "apps" ? (
          <AppsPanel copy={copy.apps} providers={copy.import.providers} connections={initialConnections} />
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ProfilePanel({
  copy,
  profile,
  onChange,
}: {
  copy: PagesCopy["account"]["dashboard"]["profile"];
  profile: ProfileData;
  onChange: (profile: ProfileData) => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    onChange({ ...profile, [key]: value });
    setStatus("idle");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          // Empty numeric fields must clear the value, not send NaN.
          heightCm: profile.heightCm === "" ? null : Number(profile.heightCm),
          weightKg: profile.weightKg === "" ? null : Number(profile.weightKg),
          trainingDays: profile.trainingDays === "" ? null : Number(profile.trainingDays),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        return;
      }
      setStatus("error");
      setError(response.status === 409 ? copy.errorHandle : copy.errorGeneric);
    } catch {
      setStatus("error");
      setError(copy.errorGeneric);
    }
  }

  return (
    <form className="ac-panel" onSubmit={save}>
      <h2>{copy.title}</h2>
      <p className="ac-panel-lede">{copy.body}</p>

      <div className="ac-grid">
        <label className="ac-field">
          <span>{copy.nameLabel}</span>
          <input value={profile.name} onChange={(event) => set("name", event.target.value)} maxLength={120} />
        </label>
        <label className="ac-field">
          <span>{copy.handleLabel}</span>
          <input value={profile.handle} onChange={(event) => set("handle", event.target.value)} maxLength={30} />
          <small>{copy.handleHint}</small>
        </label>
        <label className="ac-field">
          <span>{copy.dobLabel}</span>
          <input type="date" value={profile.dateOfBirth} onChange={(event) => set("dateOfBirth", event.target.value)} />
        </label>
        <label className="ac-field">
          <span>{copy.sexLabel}</span>
          <select value={profile.sex} onChange={(event) => set("sex", event.target.value)}>
            <option value="">—</option>
            {copy.sexOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ac-field">
          <span>{copy.heightLabel}</span>
          <input type="number" min={80} max={260} step="0.1" value={profile.heightCm} onChange={(event) => set("heightCm", event.target.value)} />
        </label>
        <label className="ac-field">
          <span>{copy.weightLabel}</span>
          <input type="number" min={25} max={400} step="0.1" value={profile.weightKg} onChange={(event) => set("weightKg", event.target.value)} />
        </label>
        <label className="ac-field">
          <span>{copy.unitsLabel}</span>
          <select value={profile.units} onChange={(event) => set("units", event.target.value)}>
            {copy.unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ac-field">
          <span>{copy.trainingDaysLabel}</span>
          <input type="number" min={0} max={14} value={profile.trainingDays} onChange={(event) => set("trainingDays", event.target.value)} />
        </label>
        <label className="ac-field">
          <span>{copy.goalLabel}</span>
          <select value={profile.goal} onChange={(event) => set("goal", event.target.value)}>
            <option value="">—</option>
            {copy.goalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ac-field">
          <span>{copy.activityLabel}</span>
          <select value={profile.activityLevel} onChange={(event) => set("activityLevel", event.target.value)}>
            <option value="">—</option>
            {copy.activityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="ac-field ac-field-wide">
        <span>{copy.bioLabel}</span>
        <textarea value={profile.bio} onChange={(event) => set("bio", event.target.value)} rows={4} maxLength={600} placeholder={copy.bioPlaceholder} />
      </label>

      <label className="ac-consent">
        <input type="checkbox" checked={profile.shareWithCreators} onChange={(event) => set("shareWithCreators", event.target.checked)} />
        <span>
          {copy.shareLabel}
          <small>{copy.shareHint}</small>
        </span>
      </label>

      {error ? (
        <p className="ac-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="ac-actions">
        <button className="ac-button" type="submit" disabled={status === "saving"}>
          {status === "saving" ? copy.saving : copy.save}
        </button>
        {status === "saved" ? (
          <span className="ac-saved" role="status">
            {copy.saved}
          </span>
        ) : null}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function DataPanel({
  copy,
  scans,
  imports,
  metricCount,
  locale,
}: {
  copy: PagesCopy["account"]["dashboard"]["import"];
  scans: ScanRow[];
  imports: ImportRow[];
  metricCount: number;
  locale: Locale;
}) {
  const [provider, setProvider] = useState(copy.providers[0].value);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const hint = copy.providers.find((item) => item.value === provider)?.hint;
  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("provider", provider);
    setStatus("working");
    setMessage("");

    try {
      const response = await fetch("/api/health/import", { method: "POST", body: form });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; import?: { metricCount: number; scanCount: number } }
        | null;

      if (response.ok && body?.import) {
        setStatus("done");
        setMessage(
          `${body.import.metricCount} ${copy.successBody} ${body.import.scanCount} ${copy.successScans}`,
        );
        router.refresh();
        return;
      }

      setStatus("error");
      if (response.status === 413) setMessage(copy.errorLarge);
      else if (body?.error === "nothing_recognised") setMessage(copy.errorNothing);
      else setMessage(copy.errorGeneric);
    } catch {
      setStatus("error");
      setMessage(copy.errorGeneric);
    }
  }

  return (
    <div className="ac-panel">
      <h2>{copy.title}</h2>
      <p className="ac-panel-lede">{copy.body}</p>

      <form className="ac-import" onSubmit={upload}>
        <label className="ac-field">
          <span>{copy.providerLabel}</span>
          <select value={provider} onChange={(event) => setProvider(event.target.value)}>
            {copy.providers.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {hint ? <small>{hint}</small> : null}
        </label>

        <label className="ac-field">
          <span>{copy.fileLabel}</span>
          <input name="file" type="file" accept=".xml,.json,.csv,.txt,text/csv,application/json,text/xml" required />
          <small>{copy.fileHint}</small>
        </label>

        <button className="ac-button" type="submit" disabled={status === "working"}>
          {status === "working" ? copy.submitting : copy.submit}
        </button>

        {message ? (
          <p className={status === "error" ? "ac-error" : "ac-saved"} role="status">
            {status === "done" ? `${copy.successTitle}. ${message}` : message}
          </p>
        ) : null}
      </form>

      <p className="ac-metric-count numeric">
        {metricCount.toLocaleString()} {copy.metricsHeld}
      </p>

      <section className="ac-subpanel">
        <h3>{copy.scansTitle}</h3>
        {scans.length === 0 ? (
          <p className="ac-empty">{copy.scansEmpty}</p>
        ) : (
          <div className="ac-table-wrap">
            <table className="ac-table">
              <thead>
                <tr>
                  {copy.scanColumns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <td>{formatDate(scan.takenAt)}</td>
                    <td className="numeric">{scan.weightKg ? `${scan.weightKg.toFixed(1)} kg` : "—"}</td>
                    <td className="numeric">{scan.bodyFatPercent ? `${scan.bodyFatPercent.toFixed(1)}%` : "—"}</td>
                    <td className="numeric">{scan.skeletalMuscleKg ? `${scan.skeletalMuscleKg.toFixed(1)} kg` : "—"}</td>
                    <td className="numeric">{scan.score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="ac-subpanel">
        <h3>{copy.historyTitle}</h3>
        {imports.length === 0 ? (
          <p className="ac-empty">{copy.historyEmpty}</p>
        ) : (
          <ul className="ac-history">
            {imports.map((run) => (
              <li key={run.id}>
                <div>
                  <strong>{run.filename ?? run.provider}</strong>
                  <span>{formatDate(run.createdAt)}</span>
                </div>
                <span className={`ac-status is-${run.status}`}>{run.status}</span>
                <b className="numeric">
                  {run.metricCount} / {run.scanCount}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AppsPanel({
  copy,
  providers,
  connections,
}: {
  copy: PagesCopy["account"]["dashboard"]["apps"];
  providers: PagesCopy["account"]["dashboard"]["import"]["providers"];
  connections: ConnectionRow[];
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, string>>(
    Object.fromEntries(connections.map((connection) => [connection.provider, connection.status])),
  );

  async function toggle(provider: string, connected: boolean) {
    const action = connected ? "disconnect" : "connect";
    setState((current) => ({ ...current, [provider]: action === "connect" ? "pending" : "revoked" }));
    await fetch("/api/health/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, action }),
    });
    router.refresh();
  }

  return (
    <div className="ac-panel">
      <h2>{copy.title}</h2>
      <p className="ac-panel-lede">{copy.body}</p>

      <ul className="ac-apps">
        {providers.map((provider) => {
          const status = state[provider.value] ?? "";
          const connected = status === "connected" || status === "pending";
          return (
            <li key={provider.value}>
              <div>
                <strong>{provider.label}</strong>
                <span>{provider.hint}</span>
                {status ? (
                  <em className={`ac-status is-${status}`}>
                    {status === "connected"
                      ? copy.statusConnected
                      : status === "pending"
                        ? copy.statusPending
                        : copy.statusRevoked}
                  </em>
                ) : null}
              </div>
              <button type="button" className={connected ? "ac-ghost" : "ac-button ac-button-small"} onClick={() => toggle(provider.value, connected)}>
                {connected ? copy.disconnect : copy.connect}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="ac-note">{copy.pendingNote}</p>
    </div>
  );
}
