import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export function Footer({ d, locale }: { d: Dictionary; locale: Locale }) {
  const columns = [
    { title: d.footer.productTitle, items: d.footer.product },
    { title: d.footer.companyTitle, items: d.footer.company },
    { title: d.footer.legalTitle, items: d.footer.legal },
  ];

  return (
    <footer className="border-t border-border bg-bg-elev pt-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-[0.82rem] leading-relaxed text-fg-2">
              {d.footer.tagline}
            </p>
            <div className="mt-6">
              <LocaleSwitcher current={locale} label={d.footer.languageLabel} />
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="eyebrow text-fg-3">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.items.map((item) => (
                  <li key={item}>
                    {/* Destinations land with the marketing site build-out. */}
                    <span className="cursor-default text-[0.82rem] text-fg-2 transition-colors hover:text-fg">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-14 rounded-xl border border-border bg-surface p-5 text-[0.72rem] leading-relaxed text-fg-3">
          {d.footer.disclaimer}
        </p>

        <div className="mt-8 flex flex-col gap-2 border-t border-border py-8 text-[0.72rem] text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Terrifit. {d.footer.rights}
          </p>
        </div>
      </Container>
    </footer>
  );
}
