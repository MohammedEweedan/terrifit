import Image, { type StaticImageData } from "next/image";

export type Shot = {
  src: StaticImageData;
  /** What the screen is, in two or three words. */
  label: string;
  /** Why it is worth showing. One short sentence. */
  note: string;
  alt: string;
};

/**
 * Real screenshots, in device frames.
 *
 * These are captures of the shipping build rather than mockups — the numbers,
 * type and spacing are what someone actually gets — so the frames stay plain
 * and let the screens carry it. The middle one sits proud because a flat row of
 * three reads as a spec sheet rather than a product.
 */
export function AppShowcase({ shots }: { shots: Shot[] }) {
  return (
    <div className="tf-shots" role="group" aria-label="Screens from the Terrifit app">
      {shots.map((shot, index) => (
        <figure key={shot.label} className="tf-shot-phone" data-lead={index === 1 ? "true" : undefined}>
          <div className="tf-shot-frame">
            <span className="tf-shot-island" aria-hidden />
            <Image
              src={shot.src}
              alt={shot.alt}
              placeholder="blur"
              sizes="(max-width: 900px) 62vw, 22vw"
            />
          </div>
          <figcaption>
            <strong>{shot.label}</strong>
            <span>{shot.note}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
