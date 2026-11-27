import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "X-Gen — Abonnement Claude Code Team | Plans partagés Claude AI",
    template: "%s | X-Gen",
  },
  description:
    "Rejoignez X-Gen : la communauté qui partage l'accès à Claude Code Team. Plans mensuels à partir de 21 000 FCFA. Paiement Mobile Money & carte via NotchPay. Join the Claude AI Team plan community.",
  keywords: [
    "xgen",
    "x-gen",
    "claude code",
    "claude code team",
    "claude ai",
    "claude ai team",
    "abonnement claude",
    "claude subscription",
    "team plan claude",
    "plan partagé claude",
    "communauté claude code",
    "claude code community",
    "anthropic team",
    "claude cameroun",
    "claude afrique",
    "mobile money claude",
    "notchpay",
    "développeurs francophones",
  ],
  authors: [{ name: "X-Gen Community" }],
  creator: "X-Gen",
  publisher: "X-Gen",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_US",
    siteName: "X-Gen",
    title: "X-Gen — Abonnement Claude Code Team partagé",
    description:
      "Accédez à Claude Code Team à prix réduit. Communauté active de développeurs, paiement simplifié via Mobile Money & carte bancaire.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "X-Gen — Claude Code Team Plans partagés",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "X-Gen — Claude Code Team à prix partagé",
    description:
      "Rejoignez une communauté de développeurs partageant l'accès à Claude AI Team. Plans mensuels abordables.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://xgen.dev",
    languages: {
      "fr-FR": "https://xgen.dev",
      "en-US": "https://xgen.dev",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "X-Gen",
  url: "https://xgen.dev",
  description:
    "Communauté de partage d'accès à Claude Code Team. Plans mensuels abordables pour développeurs.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "21000",
    priceCurrency: "XAF",
    description: "Abonnement mensuel Claude Code Team partagé",
  },
  provider: {
    "@type": "Organization",
    name: "X-Gen",
    url: "https://xgen.dev",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+237672094167",
      email: "contact@mikamba.cm",
      availableLanguage: ["French", "English"],
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
