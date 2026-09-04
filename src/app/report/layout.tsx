import type { ReactNode } from "react";
import { Anton, Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });

/**
 * The report's own document.
 *
 * It sits outside `[locale]` because a printed report is reached by a
 * single-use link with no locale in it, which means it cannot inherit that
 * layout's `<html>` — so it carries its own. Light only: this is made to be
 * printed, and a dark report either wastes a cartridge or comes out inverted.
 */
export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}
