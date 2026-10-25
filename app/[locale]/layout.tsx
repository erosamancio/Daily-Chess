import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BottomNav, SideNav } from "@/components/ui/AppNav";
import { TopBar } from "@/components/ui/TopBar";
import { ServiceWorker } from "@/components/ui/ServiceWorker";
import "@fontsource-variable/bricolage-grotesque";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: "%s · Daily Chess" },
    description: t("description"),
    applicationName: "Daily Chess",
    appleWebApp: { capable: true, title: "Daily Chess", statusBarStyle: "default" },
    metadataBase: new URL(siteUrl()),
    alternates: { languages: { pt: "/", en: "/en" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1310" },
  ],
};

const themeScript = `try{var t=localStorage.getItem("dc-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <NextIntlClientProvider>
          <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
            <SideNav />
            <div className="flex min-h-dvh min-w-0 flex-col">
              <TopBar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-[max(1rem,env(safe-area-inset-left))] pt-3 pb-28 sm:pt-6 lg:px-8 lg:pb-12">{children}</main>
            </div>
          </div>
          <BottomNav />
          <ServiceWorker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
