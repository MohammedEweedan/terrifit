"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { formatMoney } from "@/lib/shop/money";

/** The share of every sale that reaches the creator. Mirrors `payouts` copy. */
const CREATOR_SHARE = 0.8;

/**
 * What a creator would take home at their own numbers.
 *
 * The point of putting it on the page is that a coach can answer "is this worth
 * my time" without contacting anybody. It uses the real revenue split rather
 * than a flattering one, and says so underneath — a calculator that quietly
 * inflates the number is worse than no calculator.
 */
export function EarningsCalculator({ locale, copy }: { locale: Locale; copy: PagesCopy["creators"]["calculator"] }) {
  const [followers, setFollowers] = useState(8000);
  const [conversion, setConversion] = useState(2);
  const [price, setPrice] = useState(12);
  const [mapSales, setMapSales] = useState(25);
  const [mapPrice, setMapPrice] = useState(39);

  const result = useMemo(() => {
    const subscribers = Math.round((followers * conversion) / 100);
    const subsCents = subscribers * price * 100 * CREATOR_SHARE;
    const mapsCents = mapSales * mapPrice * 100 * CREATOR_SHARE;
    return {
      subscribers,
      subsCents: Math.round(subsCents),
      mapsCents: Math.round(mapsCents),
      totalCents: Math.round(subsCents + mapsCents),
    };
  }, [followers, conversion, price, mapSales, mapPrice]);

  return (
    <div className="cr-calc">
      <div className="cr-calc-controls">
        <Slider
          label={copy.followersLabel}
          value={followers}
          min={500}
          max={200000}
          step={500}
          onChange={setFollowers}
          format={(value) => value.toLocaleString()}
        />
        <Slider
          label={copy.conversionLabel}
          value={conversion}
          min={0.5}
          max={10}
          step={0.5}
          onChange={setConversion}
          format={(value) => `${value}%`}
        />
        <Slider
          label={copy.priceLabel}
          value={price}
          min={3}
          max={60}
          step={1}
          onChange={setPrice}
          format={(value) => formatMoney(value * 100, locale)}
        />
        <Slider
          label={copy.mapsLabel}
          value={mapSales}
          min={0}
          max={500}
          step={5}
          onChange={setMapSales}
          format={(value) => value.toLocaleString()}
        />
        <Slider
          label={copy.mapPriceLabel}
          value={mapPrice}
          min={9}
          max={120}
          step={1}
          onChange={setMapPrice}
          format={(value) => formatMoney(value * 100, locale)}
        />
      </div>

      <div className="cr-calc-result" aria-live="polite">
        <span>{copy.resultLabel}</span>
        <strong className="numeric">{formatMoney(result.totalCents, locale)}</strong>
        <small className="numeric">
          {formatMoney(result.totalCents * 12, locale)} {copy.annual}
        </small>
        <dl>
          <div>
            <dt>{copy.breakdownSubs}</dt>
            <dd className="numeric">
              {formatMoney(result.subsCents, locale)}
              <i>{result.subscribers.toLocaleString()}</i>
            </dd>
          </div>
          <div>
            <dt>{copy.breakdownMaps}</dt>
            <dd className="numeric">
              {formatMoney(result.mapsCents, locale)}
              <i>{mapSales.toLocaleString()}</i>
            </dd>
          </div>
        </dl>
        <p className="cr-calc-share">{copy.shareNote}</p>
      </div>

      <p className="cr-calc-disclaimer">{copy.disclaimer}</p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <label className="cr-slider">
      <span>
        {label}
        <b className="numeric">{format(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        // The filled portion is painted with a gradient stop that follows the
        // thumb, which is the only cross-browser way to tint a range track.
        style={{ "--cr-slider-fill": `${percent}%` } as React.CSSProperties}
      />
    </label>
  );
}
