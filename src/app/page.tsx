import Link from "next/link";
import { InstagramIcon, MenuBookIcon } from "@/components/icons";

const INSTAGRAM_URL = "https://www.instagram.com/suhbat_milliytaomlar/";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <p className="font-heading text-xs tracking-[0.35em] text-muted">EST. 2017</p>

        <h1 className="mt-4 font-heading text-5xl font-semibold tracking-wide text-gold-light sm:text-6xl">
          SUHBAT
        </h1>
        <p className="mt-2 font-display text-xl italic text-cream/90">Milliy taomnoma</p>

        <p className="mt-6 text-sm leading-relaxed text-muted">
          Qozonda, cho&apos;g&apos;da va sabr bilan pishirilgan taomlar.
          <br />
          Har kuni yangi go&apos;sht, har kuni yangi non.
        </p>

        <div className="mt-12 flex w-full flex-col gap-4">
          <Link
            href="/menu"
            className="flex min-h-16 items-center justify-center gap-3 rounded-lg bg-gold px-6 font-heading text-base tracking-wide text-canvas transition-colors active:bg-gold-light"
          >
            <MenuBookIcon className="h-6 w-6 shrink-0" />
            Suhbat menyu
          </Link>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-16 items-center justify-center gap-3 rounded-lg border border-panel-2 bg-surface px-6 font-heading text-base tracking-wide text-cream transition-colors active:bg-panel"
          >
            <InstagramIcon className="h-6 w-6 shrink-0 text-gold" />
            Instagram
          </a>
        </div>

        <p className="mt-10 font-body text-xs tracking-wide text-muted-2">
          @suhbat_milliytaomlar
        </p>

        <Link
          href="/admin"
          className="mt-2 flex min-h-11 items-center px-4 font-heading text-xs tracking-[0.25em] text-muted-2 transition-colors active:text-gold"
        >
          ADMIN
        </Link>
      </div>
    </main>
  );
}
