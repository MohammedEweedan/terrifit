"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { BAND_FINISHES, bandFinish, bandRender } from "./colourways";
import type { BandScene } from "./band-scene";
import styles from "./BandViewer.module.css";

const translations: Record<Locale, readonly string[]> = {
  en: ["Every angle. Your colour.", "Drag to rotate", "Pause rotation", "Auto-rotate", "Reset view", "Inside", "Rotate left", "Rotate right", "Zoom in", "Zoom out", "Design preview · Final details may change", "3D unavailable. Showing the product render.", "Loading 3D"],
  ar: ["كل زاوية. بلونك.", "اسحب للتدوير", "إيقاف الدوران", "دوران تلقائي", "إعادة العرض", "الداخل", "تدوير لليسار", "تدوير لليمين", "تكبير", "تصغير", "معاينة التصميم · قد تتغير التفاصيل النهائية", "العرض ثلاثي الأبعاد غير متاح. هذه صورة المنتج.", "جارٍ تحميل العرض"],
  de: ["Jeder Winkel. Deine Farbe.", "Zum Drehen ziehen", "Drehung pausieren", "Automatisch drehen", "Ansicht zurücksetzen", "Innenseite", "Links drehen", "Rechts drehen", "Vergrößern", "Verkleinern", "Designvorschau · Details können sich ändern", "3D nicht verfügbar. Produktbild wird angezeigt.", "3D wird geladen"],
  es: ["Cada ángulo. Tu color.", "Arrastra para girar", "Pausar giro", "Giro automático", "Restablecer vista", "Interior", "Girar izquierda", "Girar derecha", "Acercar", "Alejar", "Vista previa · Los detalles pueden cambiar", "3D no disponible. Mostrando imagen.", "Cargando 3D"],
  fr: ["Chaque angle. Votre couleur.", "Glissez pour tourner", "Mettre en pause", "Rotation automatique", "Réinitialiser la vue", "Intérieur", "Tourner à gauche", "Tourner à droite", "Agrandir", "Réduire", "Aperçu du design · Détails susceptibles de changer", "3D indisponible. Affichage du rendu.", "Chargement 3D"],
  it: ["Ogni angolo. Il tuo colore.", "Trascina per ruotare", "Pausa rotazione", "Rotazione automatica", "Ripristina vista", "Interno", "Ruota a sinistra", "Ruota a destra", "Ingrandisci", "Riduci", "Anteprima · I dettagli possono cambiare", "3D non disponibile. Immagine del prodotto.", "Caricamento 3D"],
  nl: ["Elke hoek. Jouw kleur.", "Sleep om te draaien", "Draaien pauzeren", "Automatisch draaien", "Weergave herstellen", "Binnenkant", "Links draaien", "Rechts draaien", "Inzoomen", "Uitzoomen", "Ontwerpvoorbeeld · Details kunnen veranderen", "3D niet beschikbaar. Productafbeelding weergegeven.", "3D laden"],
  pt: ["Cada ângulo. Sua cor.", "Arraste para girar", "Pausar rotação", "Rotação automática", "Redefinir vista", "Interior", "Girar à esquerda", "Girar à direita", "Ampliar", "Reduzir", "Prévia do design · Detalhes podem mudar", "3D indisponível. Exibindo imagem.", "Carregando 3D"],
  ru: ["Каждый ракурс. Ваш цвет.", "Потяните, чтобы повернуть", "Остановить вращение", "Автовращение", "Сбросить ракурс", "Изнутри", "Повернуть влево", "Повернуть вправо", "Приблизить", "Отдалить", "Предпросмотр · Детали могут измениться", "3D недоступно. Показано изображение.", "Загрузка 3D"],
  tr: ["Her açı. Senin rengin.", "Döndürmek için sürükle", "Döndürmeyi durdur", "Otomatik döndür", "Görünümü sıfırla", "İç yüzey", "Sola döndür", "Sağa döndür", "Yakınlaştır", "Uzaklaştır", "Tasarım önizlemesi · Ayrıntılar değişebilir", "3D kullanılamıyor. Ürün görseli gösteriliyor.", "3D yükleniyor"],
};

export function BandViewer({ locale, colourway, onColourway, compact = false, hero = false }: { locale: Locale; colourway?: string; onColourway?: (id: string) => void; compact?: boolean; hero?: boolean }) {
  const [ownColour, setOwnColour] = useState("black");
  const selected = bandFinish(colourway ?? ownColour);
  const finishRef = useRef(selected);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BandScene | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const reduced = useReducedMotion();
  const [autoPreference, setAutoPreference] = useState<boolean | null>(null);
  const auto = autoPreference ?? !reduced;
  const autoRef = useRef(auto);
  const t = translations[locale];

  useEffect(() => { finishRef.current = selected; }, [selected]);
  useEffect(() => { autoRef.current = auto; }, [auto]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false, started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      void import("./band-scene").then(async ({ mountBandScene }) => {
        if (cancelled) return;
        scene.current = mountBandScene(container, finishRef.current, () => setStatus("fallback"));
        scene.current.setAuto(autoRef.current);
        await scene.current.ready;
        if (!cancelled) setStatus("ready");
      }).catch(() => { if (!cancelled) setStatus("fallback"); });
    }, { rootMargin: "200px" });
    observer.observe(container);
    return () => { cancelled = true; observer.disconnect(); scene.current?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.setFinish(selected); }, [selected]);
  useEffect(() => { scene.current?.setAuto(auto); }, [auto]);
  const ready = status === "ready";

  return <section className={`${styles.viewer} ${compact ? styles.compact : ""} ${hero ? styles.hero : ""}`} aria-label={t[0]}>
    <div className={styles.top}><span>TERRIFIT BAND <b>360°</b></span><span>{selected.label}</span></div>
    <div className={styles.stage}>
      <div ref={host} className={styles.canvas} tabIndex={ready ? 0 : -1} role="group" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home Space + -" aria-label={`${selected.label}. ${t[1]}`} onKeyDown={event => {
        const actions: Record<string, () => void> = { ArrowLeft: () => scene.current?.rotate(1), ArrowRight: () => scene.current?.rotate(-1), ArrowUp: () => scene.current?.tilt(1), ArrowDown: () => scene.current?.tilt(-1), Home: () => scene.current?.reset(), " ": () => setAutoPreference(!auto), "+": () => scene.current?.zoom(1), "-": () => scene.current?.zoom(-1) };
        if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
      }} />
      {!ready ? <Image className={styles.poster} src={bandRender(selected.id)} alt={`Terrifit Band — ${selected.label}`} fill sizes="(max-width: 800px) 100vw, 900px" /> : null}
      <div className={styles.hint} aria-live="polite">{ready ? <><span aria-hidden>↔</span> {t[1]}</> : status === "fallback" ? t[11] : t[12]}</div>
    </div>
    <div className={styles.finishes} role="group" aria-label={t[0]}>{BAND_FINISHES.map(finish => <button key={finish.id} aria-pressed={selected.id === finish.id} aria-label={finish.label} onClick={() => { setOwnColour(finish.id); onColourway?.(finish.id); }}><i style={{ background: `repeating-linear-gradient(48deg,${finish.yarn} 0 2px,${finish.weave} 2px 4px)` }} /><span>{finish.label}</span></button>)}</div>
    <p className={styles.note}>{t[10]}</p>
  </section>;
}
