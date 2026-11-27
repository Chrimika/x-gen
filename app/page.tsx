"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Users, UserPlus, MessageCircle, Sparkle } from "lucide-react";
import Header, { BrandMark } from "@/components/header";
import PlanCard from "@/components/plan-card";
import CommunityStats from "@/components/community-stats";
import { usePlans, useWaitingList } from "@/lib/hooks";
import { formatPrice, DEFAULT_PRICING } from "@/lib/pricing";

const MARQUEE_WORDS = ["Claude Code", "Team Plan", "Mobile Money", "Communauté", "Prix ajusté", "Carte bancaire"];

function SpinningBadge() {
  return (
    <div className="absolute -top-5 -right-3 sm:top-6 sm:right-6 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-sun border-[2.5px] border-ink shadow-[3px_3px_0_var(--ink)] grid place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin-slow" aria-hidden>
        <defs>
          <path id="badge-circle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text className="fill-ink" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 2 }}>
          <textPath href="#badge-circle">MOBILE MONEY • CARTE • NOTCHPAY •</textPath>
        </text>
      </svg>
      <span className="text-xl sm:text-3xl font-extrabold leading-none">21k</span>
    </div>
  );
}

export default function HomePage() {
  const { plans, loading } = usePlans();
  const { entries: waitingList } = useWaitingList();

  const activePlans = useMemo(() => plans.filter((p) => p.status === "active"), [plans]);
  const totalGroupSeats = useMemo(
    () => activePlans.reduce((sum, p) => sum + p.totalSeats, 0),
    [activePlans],
  );
  const fullPrice = formatPrice(DEFAULT_PRICING.fullPriceFCFA);
  const waitingMissing = Math.max(0, 2 - waitingList.length);

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 space-y-8 sm:space-y-12">
        {/* Hero */}
        <section className="relative mt-4 sm:mt-6 rounded-[32px] bg-brand text-white border-[2.5px] border-ink shadow-[6px_6px_0_var(--ink)] px-5 pt-8 pb-7 sm:px-12 sm:py-16 animate-rise">
          <SpinningBadge />
          <div className="flex flex-wrap gap-2 mb-6 pr-20 sm:pr-0">
            <span className="chip bg-white text-ink">Acc&egrave;s partag&eacute;</span>
            <span className="chip bg-sun text-ink">
              {loading ? "…" : `${activePlans.length} plans en cours`}
            </span>
          </div>

          <h1 className="text-[2.6rem] leading-[1.02] sm:text-7xl font-extrabold tracking-tight max-w-3xl">
            Ton acc&egrave;s{" "}
            <span className="inline-block bg-sun text-ink px-2.5 sm:px-4 -rotate-2 rounded-xl border-[2.5px] border-ink shadow-[3px_3px_0_var(--ink)] my-1">
              Claude Code
            </span>{" "}
            Team, simplifi&eacute;.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-white/90 max-w-xl leading-relaxed">
            Rejoins un plan partag&eacute;, paie en Mobile Money ou par carte, et code avec Claude
            d&egrave;s aujourd&apos;hui. &Agrave; partir de{" "}
            <span className="font-extrabold text-white">{fullPrice} FCFA/mois</span>, moins si tu
            arrives en cours de cycle.
          </p>

          <div className="mt-8 grid sm:flex gap-3">
            <a href="#plans" className="btn bg-sun text-ink text-lg">
              Voir les plans <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </a>
            <a href="#create" className="btn bg-transparent text-white !border-white !shadow-none hover:!shadow-none hover:bg-white/10 text-lg">
              Cr&eacute;er un plan
            </a>
          </div>
        </section>

        {/* How it works */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", tone: "bg-sun", title: "Choisis", text: "Un plan actif avec des places libres, ou lance-en un nouveau.", icon: <Users className="w-5 h-5" /> },
            { n: "2", tone: "bg-brand text-white", title: "Paie", text: "Mobile Money ou carte via NotchPay. Prix ajusté aux jours restants.", icon: <Zap className="w-5 h-5" /> },
            { n: "3", tone: "bg-[#7ee0a1]", title: "Code", text: "Ton email est ajouté au plan Claude AI Team. C'est parti.", icon: <Shield className="w-5 h-5" /> },
          ].map((s) => (
            <div key={s.n} className="brut-card pop p-5 sm:p-6 flex sm:block items-start gap-4">
              <span className={`shrink-0 grid place-items-center w-12 h-12 rounded-full border-[2.5px] border-ink text-lg font-extrabold ${s.tone}`}>
                {s.n}
              </span>
              <div>
                <h3 className="sm:mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight">{s.title}</h3>
                <p className="mt-1 sm:mt-1.5 text-sm sm:text-base text-muted leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </section>

        <CommunityStats plans={activePlans} />

        {/* Plans */}
        <section id="plans" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Plans actifs</h2>
            <span className="chip bg-white">
              {activePlans.length} disponible{activePlans.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading
              ? [0, 1].map((i) => <div key={i} className="brut-card h-96 animate-pulse" />)
              : activePlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} totalGroupSeats={totalGroupSeats} />
                ))}
          </div>
        </section>
      </main>

      {/* Marquee */}
      <div className="bg-ink text-white border-y-[2.5px] border-ink py-3 overflow-hidden -rotate-1 my-4" aria-hidden>
        <div className="flex w-max animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center">
              {MARQUEE_WORDS.map((w) => (
                <span key={w} className="flex items-center text-2xl sm:text-3xl font-extrabold px-4 whitespace-nowrap">
                  {w}
                  <Sparkle className="w-6 h-6 ml-8 text-sun" fill="currentColor" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 sm:space-y-12">
        {/* Create a plan */}
        <section id="create" className="scroll-mt-24 relative rounded-[32px] bg-sun border-[2.5px] border-ink shadow-[6px_6px_0_var(--ink)] p-6 sm:p-10 overflow-hidden">
          <span className="chip bg-ink text-white">Liste d&apos;attente</span>
          <h2 className="mt-4 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.02] max-w-2xl">
            Aucun plan ne te va&nbsp;? Lance le tien.
          </h2>
          <p className="mt-4 text-base sm:text-lg max-w-xl leading-relaxed">
            Paie maintenant et rejoins la liste d&apos;attente. D&egrave;s que{" "}
            <span className="font-extrabold">2 personnes</span> ont pay&eacute;, le plan est cr&eacute;&eacute;
            et tout le monde a acc&egrave;s. Prix&nbsp;: <span className="font-extrabold">{fullPrice} FCFA/mois</span>.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white border-2 border-ink px-4 py-3 shadow-[3px_3px_0_var(--ink)]">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.max(2, Math.min(waitingList.length, 5)) }, (_, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 rounded-full border-2 border-ink grid place-items-center ${
                    i < waitingList.length ? "bg-brand text-white" : "bg-white text-ink/30 border-dashed"
                  }`}
                >
                  <Users className="w-4 h-4" />
                </span>
              ))}
            </div>
            <div className="leading-tight">
              <p className="font-extrabold">
                {waitingList.length} en attente
              </p>
              <p className="text-xs font-semibold text-muted">
                {waitingMissing === 0
                  ? "Minimum atteint, plan créé sous peu !"
                  : `Encore ${waitingMissing} pour démarrer`}
              </p>
            </div>
          </div>

          <div className="mt-8 grid sm:flex gap-3">
            <Link href="/checkout/new-plan" className="btn bg-brand text-white text-lg">
              <UserPlus className="w-5 h-5" strokeWidth={2.5} />
              Payer et rejoindre
            </Link>
            <a
              href="https://wa.me/237672094167"
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white text-ink text-lg"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
              Une question&nbsp;?
            </a>
          </div>

          <div className="absolute -bottom-6 -right-6 hidden sm:grid place-items-center w-44 h-44 rounded-[32px] bg-brand border-[2.5px] border-ink rotate-6">
            <span className="text-6xl font-extrabold text-white -rotate-6">2+</span>
          </div>
        </section>

        {/* Final CTA */}
        <section className="rounded-[32px] bg-ink text-white border-[2.5px] border-ink shadow-[6px_6px_0_var(--brand)] p-6 sm:p-10">
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.02]">
            Pr&ecirc;t &agrave; coder<br />
            avec <span className="text-brand">Claude</span>&nbsp;?
          </h2>
          <a href="#plans" className="btn bg-sun text-ink text-lg mt-8 w-full sm:w-auto !border-white">
            Choisir mon plan <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </a>
        </section>
      </div>

      <footer className="border-t-[2.5px] border-ink bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
          <div>
            <BrandMark size="sm" />
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Acc&egrave;s partag&eacute; &agrave; Claude Code Team pour les d&eacute;veloppeurs francophones.
              Simple, s&eacute;curis&eacute;, abordable.
            </p>
          </div>
          <div>
            <h4 className="font-extrabold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm font-semibold text-muted">
              <li><a href="#plans" className="hover:text-brand">Plans</a></li>
              <li><a href="#create" className="hover:text-brand">Cr&eacute;er un plan</a></li>
              <li><Link href="/dashboard" className="hover:text-brand">Mon espace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm font-semibold text-muted">
              <li>WhatsApp&nbsp;: +237 672 094 167</li>
              <li>Email&nbsp;: contact@mikamba.cm</li>
              <li>
                <a
                  href="https://chat.whatsapp.com/JcN64bbs3bYAfdi9EcqoMf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand"
                >
                  Rejoindre le groupe WhatsApp &rarr;
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t-2 border-ink/10 py-5 text-center text-xs font-semibold text-muted">
          &copy; 2026 X-Gen. Tous droits r&eacute;serv&eacute;s.
        </div>
      </footer>
    </div>
  );
}
