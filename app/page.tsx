"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles, Users, ArrowRight, Shield, Zap, MessageCircle, Clock, UserPlus } from "lucide-react";
import Header from "@/components/header";
import PlanCard from "@/components/plan-card";
import CommunityStats from "@/components/community-stats";
import { usePlans, useWaitingList } from "@/lib/hooks";
import { formatPrice, DEFAULT_PRICING } from "@/lib/pricing";

export default function HomePage() {
  const { plans, loading } = usePlans();
  const { entries: waitingList } = useWaitingList();

  const activePlans = useMemo(
    () => plans.filter((p) => p.status === "active"),
    [plans],
  );

  const totalGroupSeats = useMemo(
    () => activePlans.reduce((sum, p) => sum + p.totalSeats, 0),
    [activePlans],
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#FFF7F3] to-[#FFF0E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8622C]/10 text-[#E8622C] text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Communaut&eacute; active &mdash; {activePlans.length} plans en cours
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-tight tracking-tight">
              Claude Code Team
              <br />
              <span className="text-[#E8622C]">Acc&egrave;s Simplifi&eacute;</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#666] leading-relaxed max-w-2xl mx-auto">
              Rejoignez une communaut&eacute; de d&eacute;veloppeurs qui partagent l&apos;acc&egrave;s &agrave;
              Claude Code Team. Plans mensuels &agrave; partir de{" "}
              <span className="font-semibold text-[#1a1a1a]">21 000 FCFA/mois</span>,
              avec un tarif ajust&eacute; si vous rejoignez en cours de cycle.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#plans"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#E8622C] text-white font-semibold rounded-xl hover:bg-[#d4561f] active:scale-[0.97] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Voir les plans disponibles
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#create"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#1a1a1a] font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cr&eacute;er un plan
              </a>
            </div>
          </div>
        </div>
        {/* Decorative gradient blob */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#E8622C]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#E8622C]/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Value propositions */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="p-2 bg-[#22c55e]/10 rounded-lg flex-shrink-0">
              <Shield className="w-5 h-5 text-[#22c55e]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-sm">S&eacute;curis&eacute; et fiable</h3>
              <p className="text-xs text-[#666] mt-1">
                Paiements via NotchPay, comptes v&eacute;rifi&eacute;s, gestion transparente.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="p-2 bg-[#3b82f6]/10 rounded-lg flex-shrink-0">
              <Zap className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-sm">Prix ajust&eacute; en temps r&eacute;el</h3>
              <p className="text-xs text-[#666] mt-1">
                Le prix baisse au fur et &agrave; mesure du cycle. Payez uniquement les jours restants.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="p-2 bg-[#E8622C]/10 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 text-[#E8622C]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-sm">Communaut&eacute; active</h3>
              <p className="text-xs text-[#666] mt-1">
                Plus de 270 membres sur WhatsApp. Entraide, partage et &eacute;volution ensemble.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community stats */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <CommunityStats plans={activePlans} />
      </section>

      {/* Plans */}
      <section id="plans" className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            Plans actifs
          </h2>
          <span className="text-sm text-[#666]">
            {activePlans.length} plan{activePlans.length > 1 ? "s" : ""} disponible
            {activePlans.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              totalGroupSeats={totalGroupSeats}
            />
          ))}
        </div>
      </section>

      {/* Create a plan */}
      <section
        id="create"
        className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 scroll-mt-20"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">
              Cr&eacute;er un nouveau plan
            </h2>
            <p className="text-[#666] leading-relaxed mb-6 max-w-2xl">
              Aucun plan actif ne vous convient ? Payez maintenant et rejoignez la
              liste d&apos;attente. D&egrave;s qu&apos;au moins{" "}
              <span className="font-semibold text-[#1a1a1a]">2 personnes</span>{" "}
              ont pay&eacute;, le plan est cr&eacute;&eacute; et tout le monde
              b&eacute;n&eacute;ficie de l&apos;acc&egrave;s.
              Prix :{" "}
              <span className="font-semibold text-[#1a1a1a]">
                {formatPrice(DEFAULT_PRICING.fullPriceFCFA)} FCFA/mois
              </span>.
            </p>

            {/* Waiting list status */}
            {waitingList.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(waitingList.length, 5) }, (_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-[#E8622C]/10 flex items-center justify-center"
                      >
                        <Users className="w-4 h-4 text-[#E8622C]" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {waitingList.length} personne{waitingList.length > 1 ? "s" : ""} en attente
                    </p>
                    <p className="text-xs text-blue-700">
                      {waitingList.length >= 2
                        ? "Le minimum est atteint ! Le plan sera créé sous peu."
                        : `Encore ${2 - waitingList.length} personne${2 - waitingList.length > 1 ? "s" : ""} pour démarrer le plan.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-3xl font-bold text-[#E8622C]">1.</p>
                <p className="text-sm text-[#1a1a1a] font-medium mt-1">
                  Payez en ligne
                </p>
                <p className="text-xs text-[#666] mt-1">
                  {formatPrice(DEFAULT_PRICING.fullPriceFCFA)} FCFA pour un mois complet d&apos;acc&egrave;s.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-3xl font-bold text-[#E8622C]">2.</p>
                <p className="text-sm text-[#1a1a1a] font-medium mt-1">
                  Patientez
                </p>
                <p className="text-xs text-[#666] mt-1">
                  Le plan d&eacute;marre quand au moins 2 membres ont pay&eacute;.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-3xl font-bold text-[#E8622C]">3.</p>
                <p className="text-sm text-[#1a1a1a] font-medium mt-1">
                  Acc&egrave;s activ&eacute;
                </p>
                <p className="text-xs text-[#666] mt-1">
                  Votre email est ajout&eacute; au plan Claude AI Team.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/checkout/new-plan"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8622C] text-white font-semibold rounded-xl hover:bg-[#d4561f] active:scale-[0.97] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                Payer et rejoindre la liste d&apos;attente
              </Link>
              <a
                href="https://wa.me/237672094167"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1a1a1a] font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Question ? WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-[#1a1a1a]">X-Gen</span>
              </div>
              <p className="text-sm text-[#666] leading-relaxed">
                Acc&egrave;s partag&eacute; &agrave; Claude Code Team pour les d&eacute;veloppeurs
                francophones. Simplifi&eacute;, s&eacute;curis&eacute;, abordable.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">
                Navigation
              </h4>
              <ul className="space-y-2 text-sm text-[#666]">
                <li>
                  <a href="/" className="hover:text-[#E8622C] transition-colors">
                    Accueil
                  </a>
                </li>
                <li>
                  <a href="#plans" className="hover:text-[#E8622C] transition-colors">
                    Plans
                  </a>
                </li>
                <li>
                  <a href="#create" className="hover:text-[#E8622C] transition-colors">
                    Cr&eacute;er un plan
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-[#666]">
                <li>WhatsApp: +237 672 094 167</li>
                <li>Email: contact@mikamba.cm</li>
                <li>
                  <a
                    href="https://chat.whatsapp.com/example"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#E8622C] transition-colors"
                  >
                    Rejoindre le groupe WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-[#999]">
            &copy; 2026 X-Gen. Tous droits r&eacute;serv&eacute;s.
          </div>
        </div>
      </footer>
    </div>
  );
}
