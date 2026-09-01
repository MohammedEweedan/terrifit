/**
 * Renders a JSON-LD block.
 *
 * The payload is serialised with `<` escaped, so a stray angle bracket in copy
 * cannot close the script tag early and inject markup into the page.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
