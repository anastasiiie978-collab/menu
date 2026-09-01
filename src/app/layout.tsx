import type { Metadata, Viewport } from "next";
import { Oswald, Jost, Cormorant_Garamond } from "next/font/google";
import { getActiveThemeId } from "@/lib/siteSettings";
import { allThemesCss, getTheme } from "@/lib/themes";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Suhbat — Milliy taomlar",
  description: "Suhbat restorani menyusi — qozonda, cho'g'da va sabr bilan pishirilgan taomlar.",
};

// Follows the selected theme so the phone's browser chrome (the strip above the
// page on Android Chrome, the status bar area on iOS) matches the background
// instead of staying charcoal behind an ivory menu.
export async function generateViewport(): Promise<Viewport> {
  const theme = getTheme(await getActiveThemeId());
  return {
    themeColor: theme.colors.canvas,
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = getTheme(await getActiveThemeId());

  return (
    <html
      lang="uz"
      data-theme={theme.id}
      className={`${oswald.variable} ${jost.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-cream">
        {/*
          Every theme's custom properties. Constant across renders — which theme is
          *worn* is decided by `data-theme` on <html> above, server-rendered, so the
          page arrives already in the right colors with no flash and no client-side
          JavaScript involved in choosing one. See allThemesCss() for why this is
          all five rather than just the active one.

          `dangerouslySetInnerHTML` is the right tool here rather than a lapse: the
          string interpolates only hex literals from the hard-coded table in
          themes.ts, and nothing a request carries can reach it. Passing the CSS as
          a child instead would look safer while being worse — React escapes `>` in
          text, which would silently break the first child-combinator selector
          anyone adds.

          `precedence` is what makes React 19 hoist this into <head>, so it lands
          ahead of the body rather than mid-document.
        */}
        <style
          href="suhbat-themes"
          precedence="high"
          dangerouslySetInnerHTML={{ __html: allThemesCss() }}
        />
        {children}
      </body>
    </html>
  );
}
